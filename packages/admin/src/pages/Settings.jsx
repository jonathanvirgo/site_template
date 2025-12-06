import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin, Typography, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { settingsApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await settingsApi.getAll();
            form.setFieldsValue(response.data.data || {});
        } catch (error) {
            message.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            await settingsApi.updateMultiple(values);
            message.success('Settings saved!');
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

    return (
        <div className="fade-in">
            <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                style={{ maxWidth: 800 }}
            >
                {/* General Settings */}
                <Card style={{ marginBottom: 24 }}>
                    <Title level={5}>General</Title>

                    <Form.Item
                        name="site_name"
                        label="Site Name"
                    >
                        <Input placeholder="My Awesome Site" />
                    </Form.Item>

                    <Form.Item
                        name="site_description"
                        label="Site Description"
                    >
                        <TextArea rows={2} placeholder="A brief description of your site" />
                    </Form.Item>

                    <Form.Item
                        name="site_url"
                        label="Site URL"
                    >
                        <Input placeholder="https://example.com" />
                    </Form.Item>

                    <Form.Item
                        name="admin_email"
                        label="Admin Email"
                    >
                        <Input type="email" placeholder="admin@example.com" />
                    </Form.Item>
                </Card>

                {/* Content Settings */}
                <Card style={{ marginBottom: 24 }}>
                    <Title level={5}>Content</Title>

                    <Form.Item
                        name="posts_per_page"
                        label="Posts Per Page"
                    >
                        <Input type="number" placeholder="10" style={{ width: 150 }} />
                    </Form.Item>

                    <Form.Item
                        name="date_format"
                        label="Date Format"
                    >
                        <Input placeholder="MMMM D, YYYY" />
                    </Form.Item>
                </Card>

                {/* Social Media */}
                <Card style={{ marginBottom: 24 }}>
                    <Title level={5}>Social Media</Title>

                    <Form.Item
                        name="social_twitter"
                        label="Twitter URL"
                    >
                        <Input placeholder="https://twitter.com/your-handle" />
                    </Form.Item>

                    <Form.Item
                        name="social_facebook"
                        label="Facebook URL"
                    >
                        <Input placeholder="https://facebook.com/your-page" />
                    </Form.Item>

                    <Form.Item
                        name="social_instagram"
                        label="Instagram URL"
                    >
                        <Input placeholder="https://instagram.com/your-handle" />
                    </Form.Item>

                    <Form.Item
                        name="social_linkedin"
                        label="LinkedIn URL"
                    >
                        <Input placeholder="https://linkedin.com/company/your-company" />
                    </Form.Item>

                    <Form.Item
                        name="social_github"
                        label="GitHub URL"
                    >
                        <Input placeholder="https://github.com/your-username" />
                    </Form.Item>
                </Card>

                {/* Footer */}
                <Card style={{ marginBottom: 24 }}>
                    <Title level={5}>Footer</Title>

                    <Form.Item
                        name="footer_copyright"
                        label="Copyright Text"
                    >
                        <Input placeholder="© 2024 Your Company. All rights reserved." />
                    </Form.Item>
                </Card>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<SaveOutlined />}
                        loading={saving}
                    >
                        Save Settings
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
