/** Same base URL for all API calls in Tut5 (CORS: FastAPI on port 8000, Vite on 5173). */
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'
