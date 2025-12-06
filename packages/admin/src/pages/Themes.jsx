import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Modal, message, Spin, Typography, Empty, Badge, Tooltip } from 'antd';
import { CheckCircleOutlined, ImportOutlined, SettingOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { themeApi } from '../services/api';

const { Title, Text } = Typography;

export default function Themes() {
    const [loading, setLoading] = useState(true);
    const [themes, setThemes] = useState([]);
    const [activating, setActivating] = useState(null);
    const [importing, setImporting] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadThemes();
    }, []);

    const loadThemes = async () => {
        try {
            const response = await themeApi.getAll();
            setThemes(response.data.data || []);
        } catch (error) {
            message.error('Failed to load themes');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (theme) => {
        setActivating(theme.slug);
        try {
            await themeApi.activate(theme.slug);
            message.success(`Theme "${theme.name}" activated!`);
            loadThemes();
        } catch (error) {
            message.error('Failed to activate theme');
        } finally {
            setActivating(null);
        }
    };

    const handleImportDemo = (theme) => {
        Modal.confirm({
            title: 'Import Demo Data?',
            content: (
                <div>
                    <p>This will import demo content for "{theme.name}" including:</p>
                    <ul style={{ marginTop: 12 }}>
                        <li>Demo pages with content</li>
                        <li>Demo images (downloaded automatically)</li>
                        <li>Sample menus and settings</li>
                    </ul>
                    <p style={{ marginTop: 12, color: '#888' }}>
                        Existing content with the same slugs will be updated.
                    </p>
                </div>
            ),
            okText: 'Import Demo',
            okType: 'primary',
            onOk: async () => {
                setImporting(theme.slug);
                try {
                    const response = await themeApi.importDemo(theme.slug);
                    const result = response.data.data;
                    message.success(
                        `Imported ${result.pages} pages, ${result.images} images, ${result.menus} menus`
                    );
                    loadThemes();
                } catch (error) {
                    message.error('Failed to import demo data');
                } finally {
                    setImporting(null);
                }
            },
        });
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await themeApi.refresh();
            message.success('Themes refreshed');
            loadThemes();
        } catch (error) {
            message.error('Failed to refresh themes');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Themes</Title>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                    Refresh
                </Button>
            </div>

            {themes.length === 0 ? (
                <Card>
                    <Empty description="No themes found. Add themes to the /themes folder." />
                </Card>
            ) : (
                <div className="theme-grid">
                    {themes.map((theme) => (
                        <Card
                            key={theme.id}
                            className={`theme-card ${theme.isActive ? 'active' : ''}`}
                            cover={
                                <div className="theme-thumbnail">
                                    <img
                                        src={theme.thumbnailUrl || `/themes/${theme.path}/demo/images/thumbnail.jpg`}
                                        alt={theme.name}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x200?text=No+Preview';
                                        }}
                                    />
                                </div>
                            }
                            actions={[
                                theme.isActive ? (
                                    <Tag color="green" icon={<CheckCircleOutlined />} key="active">
                                        Active
                                    </Tag>
                                ) : (
                                    <Button
                                        key="activate"
                                        type="link"
                                        loading={activating === theme.slug}
                                        onClick={() => handleActivate(theme)}
                                    >
                                        Activate
                                    </Button>
                                ),
                                theme.hasDemo && (
                                    <Button
                                        key="demo"
                                        type="link"
                                        icon={<ImportOutlined />}
                                        loading={importing === theme.slug}
                                        onClick={() => handleImportDemo(theme)}
                                    >
                                        Demo
                                    </Button>
                                ),
                                <Button
                                    key="settings"
                                    type="link"
                                    icon={<SettingOutlined />}
                                    onClick={() => navigate(`/themes/${theme.slug}`)}
                                >
                                    Settings
                                </Button>,
                            ].filter(Boolean)}
                        >
                            <Card.Meta
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="theme-name">{theme.name}</span>
                                        {theme.isActive && (
                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                        )}
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <Text type="secondary" className="theme-version">
                                                v{theme.version}
                                            </Text>
                                            {theme._count?.pages > 0 && (
                                                <Tooltip title={`${theme._count.pages} pages using this theme`}>
                                                    <Tag icon={<FileTextOutlined />} color="blue">
                                                        {theme._count.pages} pages
                                                    </Tag>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <p style={{ marginTop: 0, color: '#666' }}>
                                            {theme.description || 'No description'}
                                        </p>
                                    </div>
                                }
                            />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
