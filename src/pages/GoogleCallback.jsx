import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/api';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      api.get('/me')
        .then(res => {
          setUser(res.data.user || res.data);
          navigate('/home');
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, []);

  return <div className="min-h-screen flex items-center justify-center">Signing you in...</div>;
}