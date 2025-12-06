import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Themes from './pages/Themes';
import ThemeDetail from './pages/ThemeDetail';
import Pages from './pages/Pages';
import PageEditor from './pages/PageEditor';
import Posts from './pages/Posts';
import PostEditor from './pages/PostEditor';
import PostCategories from './pages/PostCategories';
import Products from './pages/Products';
import ProductEditor from './pages/ProductEditor';
import ProductCategories from './pages/ProductCategories';
import Crawler from './pages/Crawler';
import Media from './pages/Media';
import Settings from './pages/Settings';

// Protected Route Component
function ProtectedRoute({ children }) {
    const { token, isLoading } = useAuthStore();

    if (isLoading) {
        return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="themes" element={<Themes />} />
                <Route path="themes/:slug" element={<ThemeDetail />} />
                <Route path="pages" element={<Pages />} />
                <Route path="pages/new" element={<PageEditor />} />
                <Route path="pages/:id" element={<PageEditor />} />
                <Route path="posts" element={<Posts />} />
                <Route path="posts/new" element={<PostEditor />} />
                <Route path="posts/:id" element={<PostEditor />} />
                <Route path="posts/categories" element={<PostCategories />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductEditor />} />
                <Route path="products/:id" element={<ProductEditor />} />
                <Route path="products/categories" element={<ProductCategories />} />
                <Route path="crawler" element={<Crawler />} />
                <Route path="media" element={<Media />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;

