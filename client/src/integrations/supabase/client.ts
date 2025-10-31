// Stub file for Supabase client during migration to Express backend
// This prevents errors when components still reference the old Supabase client

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
    verifyOtp: async () => ({ data: null, error: new Error('Supabase removed - use Express API') }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: new Error('Supabase removed - use Express API') }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      order: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: new Error('Supabase removed - use Express API') }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Supabase removed - use Express API') }),
        }),
      }),
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  }),
  functions: {
    invoke: async () => ({ data: null, error: new Error('Supabase removed - use Express API') }),
  },
};