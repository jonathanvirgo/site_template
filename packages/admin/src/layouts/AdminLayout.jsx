import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    SkinOutlined,
    CloudDownloadOutlined,
    PictureOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ReadOutlined,
    ShoppingOutlined,
    FolderOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/themes', icon: <SkinOutlined />, label: 'Themes' },
    { key: '/pages', icon: <FileTextOutlined />, label: 'Pages' },
    {
        key: 'posts-group',
        icon: <ReadOutlined />,
        label: 'Posts',
        children: [
            { key: '/posts', label: 'All Posts' },
            { key: '/posts/new', label: 'Add New' },
            { key: '/posts/categories', label: 'Categories' },
        ],
    },
    {
        key: 'products-group',
        icon: <ShoppingOutlined />,
        label: 'Products',
        children: [
            { key: '/products', label: 'All Products' },
            { key: '/products/new', label: 'Add New' },
            { key: '/products/categories', label: 'Categories' },
        ],
    },
    { key: '/crawler', icon: <CloudDownloadOutlined />, label: 'Content Crawler' },
    { key: '/media', icon: <PictureOutlined />, label: 'Media' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { token: themeToken } = theme.useToken();

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
            onClick: () => {
                logout();
                navigate('/login');
            },
        },
    ];

    return (
        <Layout className="admin-layout">
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    background: '#fff',
                    borderRight: '1px solid #f0f0f0',
                }}
            >
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #f0f0f0',
                }}>
                    <span style={{
                        fontSize: collapsed ? 20 : 24,
                        fontWeight: 700,
                        color: themeToken.colorPrimary,
                    }}>
                        {collapsed ? 'C' : 'CMS'}
                    </span>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ border: 'none', marginTop: 8 }}
                />
            </Sider>

            <Layout>
                <Header className="admin-header">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: 16 }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer'
                            }}>
                                <Avatar
                                    size="small"
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: themeToken.colorPrimary }}
                                />
                                <span>{user?.name || 'Admin'}</span>
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                <Content className="admin-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
