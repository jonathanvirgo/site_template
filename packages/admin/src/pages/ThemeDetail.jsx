import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Switch, message, Spin, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { themeApi } from '../services/api';

const { Title, Text } = Typography;

export default function ThemeDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [theme, setTheme] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadTheme();
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

    return (
        <div className="fade-in">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/themes')}
                style={{ marginBottom: 16 }}
            >
                Back to Themes
            </Button>

            <Card>
                <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                    <div style={{
                        width: 200,
                        height: 150,
                        background: '#f5f5f5',
                        borderRadius: 8,
                        overflow: 'hidden',
                    }}>
                        <img
                            src={`/themes/${theme.path}/demo/images/thumbnail.jpg`}
                            alt={theme.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200x150?text=No+Preview';
                            }}
                        />
                    </div>
                    <div>
                        <Title level={4} style={{ marginBottom: 8 }}>{theme.name}</Title>
                        <Text type="secondary">Version {theme.version}</Text>
                        <p style={{ marginTop: 8, color: '#666' }}>{theme.description}</p>
                        {theme.templates && (
                            <p style={{ marginTop: 8 }}>
                                <strong>Templates:</strong> {theme.templates.join(', ')}
                            </p>
                        )}
                    </div>
                </div>

                <Divider />

                <Title level={5}>Theme Settings</Title>

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
            </Card>
        </div>
    );
}
