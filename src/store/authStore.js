import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  setUser: (userData, token) => {
    if (token) localStorage.setItem('token', token);

    // Normalize snake_case → camelCase once here
    const user = {
      ...userData,
      firstName: userData.first_name ?? userData.firstName ?? '',
      lastName: userData.last_name ?? userData.lastName ?? '',
      dateOfBirth: userData.date_of_birth ?? userData.dateOfBirth ?? '',
    };

    set({ user, isLoading: false });
  },
}))

export default useAuthStore