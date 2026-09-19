import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';

const mockUser = { uid: 'my-uid', isAnonymous: false };
const mockGetOwnerUid = jest.fn();
const mockClearMyGroup = jest.fn().mockResolvedValue(undefined);
const mockUnsubscribe = jest.fn();
let mockOnRemoved: (() => void) | null = null;
const mockWatchMembership = jest.fn((_owner: string, _me: string, onRemoved: () => void) => {
  mockOnRemoved = onRemoved;
  return mockUnsubscribe;
});

jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../services/SharingService', () => ({
  getOwnerUid: (uid: string) => mockGetOwnerUid(uid),
  clearMyGroup: (uid: string) => mockClearMyGroup(uid),
  watchMembership: (o: string, m: string, cb: () => void) => mockWatchMembership(o, m, cb),
}));

import { SharingProvider, useSharing } from '../context/SharingContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SharingProvider>{children}</SharingProvider>
);

describe('SharingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnRemoved = null;
  });

  it('自分がオーナーなら、グループから外される監視はしない', async () => {
    mockGetOwnerUid.mockResolvedValue('my-uid');
    const { result } = renderHook(() => useSharing(), { wrapper });

    await waitFor(() => expect(result.current.ownerUid).toBe('my-uid'));
    expect(result.current.isOwner).toBe(true);
    expect(mockWatchMembership).not.toHaveBeenCalled();
  });

  it('他人のグループに参加中にオーナーから外されたら、すぐ自分の冷蔵庫に戻る', async () => {
    mockGetOwnerUid.mockResolvedValue('owner-uid');
    const { result } = renderHook(() => useSharing(), { wrapper });

    await waitFor(() => expect(result.current.ownerUid).toBe('owner-uid'));
    expect(result.current.isOwner).toBe(false);
    expect(mockWatchMembership).toHaveBeenCalledWith('owner-uid', 'my-uid', expect.any(Function));

    act(() => mockOnRemoved!());

    await waitFor(() => expect(result.current.ownerUid).toBe('my-uid'));
    expect(result.current.isOwner).toBe(true);
    expect(mockClearMyGroup).toHaveBeenCalledWith('my-uid');
    // 自分の冷蔵庫に戻ったら監視をやめる
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
