import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  membership: 'basic' | 'premium' | 'vip' | 'annual';
  status: 'active' | 'expired' | 'paused';
  joinDate: string;
  expiryDate: string;
  isMonthlyPaid: boolean;
  monthlyPaidUntil?: string;
  venueId: string;
}

interface MemberState {
  members: Member[];
  addMember: (member: Omit<Member, 'id'>) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  getMembersByVenue: (venueId: string) => Member[];
  getMonthlyPaidMembers: (venueId: string) => Member[];
  setMemberMonthlyStatus: (id: string, isPaid: boolean, paidUntil?: string) => void;
}

// Initial mock data with monthly subscription info
const initialMembers: Member[] = [
  {
    id: 'm1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    membership: 'premium',
    status: 'active',
    joinDate: '2024-01-15',
    expiryDate: '2026-02-15',
    isMonthlyPaid: true,
    monthlyPaidUntil: '2026-02-28',
    venueId: 'g1',
  },
  {
    id: 'm2',
    name: 'Mike Johnson',
    email: 'mike.johnson@email.com',
    phone: '+91 98765 43211',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    membership: 'vip',
    status: 'active',
    joinDate: '2024-02-20',
    expiryDate: '2026-03-20',
    isMonthlyPaid: true,
    monthlyPaidUntil: '2026-02-28',
    venueId: 'g1',
  },
  {
    id: 'm3',
    name: 'Emily Watson',
    email: 'emily.watson@email.com',
    phone: '+91 98765 43212',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    membership: 'basic',
    status: 'active',
    joinDate: '2024-03-10',
    expiryDate: '2026-04-10',
    isMonthlyPaid: false,
    venueId: 'g1',
  },
  {
    id: 'm4',
    name: 'David Park',
    email: 'david.park@email.com',
    phone: '+91 98765 43213',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    membership: 'annual',
    status: 'active',
    joinDate: '2024-01-22',
    expiryDate: '2027-01-22',
    isMonthlyPaid: true,
    monthlyPaidUntil: '2026-02-28',
    venueId: 'g1',
  },
  {
    id: 'm5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@email.com',
    phone: '+91 98765 43214',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
    membership: 'premium',
    status: 'active',
    joinDate: '2024-04-05',
    expiryDate: '2026-05-05',
    isMonthlyPaid: false,
    venueId: 'g1',
  },
];

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: initialMembers,

      addMember: (memberData) => {
        const newMember: Member = {
          ...memberData,
          id: `m${Date.now()}`,
        };
        set((state) => ({
          members: [...state.members, newMember],
        }));
        return newMember;
      },

      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      deleteMember: (id) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));
      },

      getMembersByVenue: (venueId) => {
        return get().members.filter((m) => m.venueId === venueId);
      },

      getMonthlyPaidMembers: (venueId) => {
        const today = new Date().toISOString().split('T')[0];
        return get().members.filter(
          (m) =>
            m.venueId === venueId &&
            m.isMonthlyPaid &&
            m.status === 'active' &&
            (!m.monthlyPaidUntil || m.monthlyPaidUntil >= today)
        );
      },

      setMemberMonthlyStatus: (id, isPaid, paidUntil) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id
              ? {
                  ...m,
                  isMonthlyPaid: isPaid,
                  monthlyPaidUntil: paidUntil,
                }
              : m
          ),
        }));
      },
    }),
    {
      name: 'member_store',
    }
  )
);
