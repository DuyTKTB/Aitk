/* routes.js — danh sách route hash hợp lệ. App.jsx dùng useRoute() để biết
   khi nào render <NotFound />. HÃY BỔ SUNG đủ các route thật của app. */
import { useEffect, useState } from 'react';

export const ROUTES = ['', 'home', 'ai', 'quiz', 'balance', 'stats', 'settings', 'feedback', 'login', 'tools'];

const parse = () => (location.hash || '').replace(/^#\/?/, '').split(/[/?]/)[0];

export function useRoute() {
  const [route, setRoute] = useState(parse());
  useEffect(() => {
    const f = () => setRoute(parse());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return { route, known: ROUTES.includes(route) };
}
