import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, message, Spin, Typography, Divider, Tabs, Table, Tag, List, Row, Col, Statistic, Badge } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, FileTextOutlined, AppstoreOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { themeApi } from '../services/api';

const { Title, Text } = Typography;

export default function ThemeDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [theme, setTheme] = useState(null);
    const [pages, setPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadTheme();
        loadPages();
    }, [slug]);

    const loadTheme = async () => {
        try {
            const response = await themeApi.getOne(slug);
            setTheme(response.data.data);
            form.setFieldsValue(response.data.data.settings || {});
        } catch (error) {
            message.error('Failed to load theme');
            navigate('/themes');
        } finally {
            setLoading(false);
        }
    };

    const loadPages = async () => {
        setLoadingPages(true);
        try {
            const response = await themeApi.getPages(slug);
            setPages(response.data.data || []);
        } catch (error) {
            console.error('Failed to load pages:', error);
        } finally {
            setLoadingPages(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            await themeApi.updateSettings(slug, values);
            message.success('Theme settings saved!');
        } catch (error) {
            message.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!theme) {
        return null;
    }

    const pageColumns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Link to={`/pages/${record.id}`}>
                    {text}
                    {record.isHomepage && <Tag color="blue" style={{ marginLeft: 8 }}>Homepage</Tag>}
                </Link>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => <code>/{text}</code>,
        },
        {
            title: 'Template',
            dataIndex: 'template',
            key: 'template',
            render: (text) => <Tag color="purple">{text}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'PUBLISHED' ? 'green' : status === 'DRAFT' ? 'orange' : 'default'}>
                    {status}
                </Tag>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'overview',
            label: (
                <span>
                    <AppstoreOutlined />
                    Overview
                </span>
            ),
            children: (
                <div>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={8}>
                            <div style={{
                                width: '100%',
                                height: 200,
                                background: '#f5f5f5',
                                borderRadius: 8,
                                overflow: 'hidden',
                            }}>
                                <img
                                    src={`/themes/${theme.path}/demo/images/thumbnail.jpg`}
                                    alt={theme.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x200?text=No+Preview';
                                    }}
                                />
                            </div>
                        </Col>
                        <Col xs={24} md={16}>
                            <Title level={4} style={{ marginBottom: 8 }}>{theme.name}</Title>
                            <Text type="secondary">Version {theme.version}</Text>
                            <p style={{ marginTop: 12, color: '#666' }}>{theme.description}</p>

                            <Row gutter={16} style={{ marginTop: 24 }}>
                                <Col span={8}>
                                    <Statistic
                                        title="Pages"
                                        value={pages.length}
                                        prefix={<FileTextOutlined />}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic
                                        title="Templates"
                                        value={theme.templates?.length || 0}
                                        prefix={<AppstoreOutlined />}
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic
                                        title="Features"
                                        value={Object.keys(theme.features || {}).length}
                                        prefix={<CheckCircleOutlined />}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                    <Divider />

                    <Title level={5}>Available Templates</Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                        {theme.templates?.map((template) => (
                            <Tag key={template} color="blue" style={{ padding: '4px 12px', fontSize: 14 }}>
                                {template}.njk
                            </Tag>
                        ))}
                    </div>

                    <Title level={5}>Features</Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {Object.entries(theme.features || {}).map(([key, value]) => (
                            <Tag
                                key={key}
                                color={value ? 'green' : 'default'}
                                icon={value ? <CheckCircleOutlined /> : null}
                            >
                                {key}: {value ? 'Yes' : 'No'}
                            </Tag>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            key: 'pages',
            label: (
                <span>
                    <FileTextOutlined />
                    Pages ({pages.length})
                </span>
            ),
            children: (
                <div>
                    <Title level={5} style={{ marginBottom: 16 }}>Pages Using This Theme</Title>
                    <Table
                        columns={pageColumns}
                        dataSource={pages}
                        rowKey="id"
                        loading={loadingPages}
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: 'No pages are using this theme yet' }}
                    />
                </div>
            ),
        },
        {
            key: 'settings',
            label: (
                <span>
                    <SettingOutlined />
                    Settings
                </span>
            ),
            children: (
                <div>
                    <Title level={5} style={{ marginBottom: 16 }}>Theme Settings</Title>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                        style={{ maxWidth: 600 }}
                    >
                        <Form.Item
                            name="primaryColor"
                            label="Primary Color"
                        >
                            <Input type="color" style={{ width: 100, height: 40 }} />
                        </Form.Item>

                        <Form.Item
                            name="accentColor"
                            label="Accent Color"
                        >
                            <Input type="color" style={{ width: 100, height: 40 }} />
                        </Form.Item>

                        <Form.Item
                            name="fontFamily"
                            label="Font Family"
                        >
                            <Input placeholder="Inter, system-ui, sans-serif" />
                        </Form.Item>

                        <Form.Item
                            name="headerStyle"
                            label="Header Style"
                        >
                            <Input placeholder="fixed or static" />
                        </Form.Item>

                        <Form.Item
                            name="maxWidth"
                            label="Max Content Width"
                        >
                            <Input placeholder="1200px" />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={saving}
                                icon={<SaveOutlined />}
                            >
                                Save Settings
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/themes')}
                >
                    Back to Themes
                </Button>
                {theme.isActive && (
                    <Badge status="success" text="Active Theme" />
                )}
            </div>

            <Card>
                <Tabs defaultActiveKey="overview" items={tabItems} />
            </Card>
        </div>
    );
}
