import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: true,

            login: async (email, password) => {
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { token, user } = response.data.data;

                    set({ token, user, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    return { success: true };
                } catch (error) {
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Login failed'
                    };
                }
            },

            logout: () => {
                set({ token: null, user: null });
                delete api.defaults.headers.common['Authorization'];
            },

            checkAuth: async () => {
                const token = get().token;
                if (!token) {
                    set({ isLoading: false });
                    return;
                }

                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/auth/me');
                    set({ user: response.data.data, isLoading: false });
                } catch (error) {
                    set({ token: null, user: null, isLoading: false });
                    delete api.defaults.headers.common['Authorization'];
                }
            },

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user }),
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
                state?.checkAuth?.();
            },
        }
    )
);
