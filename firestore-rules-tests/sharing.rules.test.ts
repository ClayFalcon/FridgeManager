import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

// Firestore エミュレータ上で firestore.rules を検証する（npm run test:rules）
const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';
const CODE = 'ABC234';

let env: RulesTestEnvironment;

const hoursFromNow = (h: number) => Timestamp.fromDate(new Date(Date.now() + h * 60 * 60 * 1000));
const dbAs = (uid: string) => env.authenticatedContext(uid).firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-fridgemanager',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe('招待コード（invites）', () => {
  it('オーナーは自分の招待コードを発行できる', async () => {
    await assertSucceeds(
      setDoc(doc(dbAs(OWNER), 'invites', CODE), { ownerUid: OWNER, expiresAt: hoursFromNow(24) }),
    );
  });

  it('他人をオーナーにした招待コードは発行できない', async () => {
    await assertFails(
      setDoc(doc(dbAs(STRANGER), 'invites', CODE), { ownerUid: OWNER, expiresAt: hoursFromNow(24) }),
    );
  });

  it('有効期限を25時間より先にした招待コードは発行できない', async () => {
    await assertFails(
      setDoc(doc(dbAs(OWNER), 'invites', CODE), { ownerUid: OWNER, expiresAt: hoursFromNow(24 * 30) }),
    );
  });

  it('ログイン中ならコードを指定して読める', async () => {
    await seed(`invites/${CODE}`, { ownerUid: OWNER, expiresAt: hoursFromNow(24) });
    await assertSucceeds(getDoc(doc(dbAs(MEMBER), 'invites', CODE)));
  });

  it('招待コードの一覧は取得できない（コードを集められない）', async () => {
    await seed(`invites/${CODE}`, { ownerUid: OWNER, expiresAt: hoursFromNow(24) });
    await assertFails(getDocs(collection(dbAs(STRANGER), 'invites')));
  });
});

describe('共有グループへの参加（members）', () => {
  const join = (uid: string, memberUid: string, data: Record<string, unknown>) =>
    setDoc(doc(dbAs(uid), 'users', OWNER, 'members', memberUid), data);

  beforeEach(async () => {
    await seed(`invites/${CODE}`, { ownerUid: OWNER, expiresAt: hoursFromNow(24) });
  });

  it('有効な招待コードを添えれば参加できる', async () => {
    await assertSucceeds(join(MEMBER, MEMBER, { joinedAt: serverTimestamp(), inviteCode: CODE }));
  });

  it('招待コードなしでは参加できない', async () => {
    await assertFails(join(STRANGER, STRANGER, { joinedAt: serverTimestamp() }));
  });

  it('存在しない招待コードでは参加できない', async () => {
    await assertFails(join(STRANGER, STRANGER, { joinedAt: serverTimestamp(), inviteCode: 'ZZZZZZ' }));
  });

  it('別のオーナーの招待コードでは参加できない', async () => {
    await seed('invites/OTHER2', { ownerUid: STRANGER, expiresAt: hoursFromNow(24) });
    await assertFails(join(MEMBER, MEMBER, { joinedAt: serverTimestamp(), inviteCode: 'OTHER2' }));
  });

  it('期限切れの招待コードでは参加できない', async () => {
    await seed('invites/EXPD22', { ownerUid: OWNER, expiresAt: hoursFromNow(-1) });
    await assertFails(join(MEMBER, MEMBER, { joinedAt: serverTimestamp(), inviteCode: 'EXPD22' }));
  });

  it('他人をメンバーとして追加することはできない', async () => {
    await assertFails(join(STRANGER, MEMBER, { joinedAt: serverTimestamp(), inviteCode: CODE }));
  });

  it('余計な項目を含めた参加はできない', async () => {
    await assertFails(
      join(MEMBER, MEMBER, { joinedAt: serverTimestamp(), inviteCode: CODE, role: 'owner' }),
    );
  });

  it('参加後のメンバー情報は書き換えられない', async () => {
    await seed(`users/${OWNER}/members/${MEMBER}`, { joinedAt: hoursFromNow(0), inviteCode: CODE });
    await assertFails(
      updateDoc(doc(dbAs(MEMBER), 'users', OWNER, 'members', MEMBER), { inviteCode: 'X' }),
    );
  });

  it('オーナーはメンバーを削除でき、メンバーは自分で抜けられる', async () => {
    await seed(`users/${OWNER}/members/${MEMBER}`, { joinedAt: hoursFromNow(0), inviteCode: CODE });
    await assertSucceeds(deleteDoc(doc(dbAs(OWNER), 'users', OWNER, 'members', MEMBER)));
    await seed(`users/${OWNER}/members/${MEMBER}`, { joinedAt: hoursFromNow(0), inviteCode: CODE });
    await assertSucceeds(deleteDoc(doc(dbAs(MEMBER), 'users', OWNER, 'members', MEMBER)));
  });
});

describe('共有データ（food_items）', () => {
  beforeEach(async () => {
    await seed(`users/${OWNER}/food_items/1`, { name: '牛乳' });
  });

  it('メンバーはオーナーの食品を読み書きできる', async () => {
    await seed(`users/${OWNER}/members/${MEMBER}`, { joinedAt: hoursFromNow(0), inviteCode: CODE });
    await assertSucceeds(getDoc(doc(dbAs(MEMBER), 'users', OWNER, 'food_items', '1')));
    await assertSucceeds(setDoc(doc(dbAs(MEMBER), 'users', OWNER, 'food_items', '2'), { name: '卵' }));
  });

  it('メンバーでなければオーナーの食品を読めない', async () => {
    await assertFails(getDoc(doc(dbAs(STRANGER), 'users', OWNER, 'food_items', '1')));
  });
});

describe('所属グループ（profile/sharing）', () => {
  it('本人は読み書きできる', async () => {
    const ref = doc(dbAs(MEMBER), 'users', MEMBER, 'profile', 'sharing');
    await assertSucceeds(setDoc(ref, { ownerUid: OWNER }));
    await assertSucceeds(getDoc(ref));
  });

  it('他人は読み書きできない', async () => {
    await seed(`users/${MEMBER}/profile/sharing`, { ownerUid: OWNER });
    await assertFails(getDoc(doc(dbAs(OWNER), 'users', MEMBER, 'profile', 'sharing')));
    await assertFails(setDoc(doc(dbAs(OWNER), 'users', MEMBER, 'profile', 'sharing'), { ownerUid: null }));
  });
});
