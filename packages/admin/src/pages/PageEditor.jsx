import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card, Form, Input, Button, Select, Switch, message, Spin,
    Typography, Row, Col, Divider
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { pageApi, themeApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function PageEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id || id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [themes, setThemes] = useState([]);
    const [templates, setTemplates] = useState(['page', 'home', 'blog', 'single', 'contact']);
    const [form] = Form.useForm();

    useEffect(() => {
        loadThemes();
        if (!isNew) {
            loadPage();
        }
    }, [id]);

    const loadThemes = async () => {
        try {
            const response = await themeApi.getAll();
            setThemes(response.data.data || []);

            // Get templates from active theme
            const activeTheme = response.data.data?.find(t => t.isActive);
            if (activeTheme?.templates) {
                setTemplates(activeTheme.templates);
            }
        } catch (error) {
            console.error('Failed to load themes');
        }
    };

    const loadPage = async () => {
        try {
            const response = await pageApi.getOne(id);
            const page = response.data.data;

            form.setFieldsValue({
                ...page,
                contentJson: page.content ? JSON.stringify(page.content, null, 2) : '',
            });
        } catch (error) {
            message.error('Failed to load page');
            navigate('/pages');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            // Parse content JSON
            let content = null;
            if (values.contentJson) {
                try {
                    content = JSON.parse(values.contentJson);
                } catch {
                    message.error('Invalid JSON in content field');
                    setSaving(false);
                    return;
                }
            }

            const data = {
                ...values,
                content,
            };
            delete data.contentJson;

            if (isNew) {
                const response = await pageApi.create(data);
                message.success('Page created!');
                navigate(`/pages/${response.data.data.id}`);
            } else {
                await pageApi.update(id, data);
                message.success('Page saved!');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save page');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        const values = form.getFieldsValue();
        await handleSave({ ...values, status: 'PUBLISHED' });
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/pages')}
                >
                    Back to Pages
                </Button>
                <Button.Group>
                    <Button
                        icon={<SaveOutlined />}
                        onClick={() => form.submit()}
                        loading={saving}
                    >
                        Save Draft
                    </Button>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={handlePublish}
                        loading={saving}
                    >
                        Publish
                    </Button>
                </Button.Group>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                    template: 'page',
                    status: 'DRAFT',
                    isHomepage: false,
                }}
            >
                <Row gutter={24}>
                    {/* Main Editor */}
                    <Col xs={24} lg={16}>
                        <Card className="editor-main">
                            <Form.Item
                                name="title"
                                label="Title"
                                rules={[{ required: true, message: 'Title is required' }]}
                            >
                                <Input size="large" placeholder="Page title" />
                            </Form.Item>

                            <Form.Item
                                name="slug"
                                label="Slug"
                                help="Leave empty to auto-generate from title"
                            >
                                <Input addonBefore="/" placeholder="page-url-slug" />
                            </Form.Item>

                            <Form.Item
                                name="excerpt"
                                label="Excerpt"
                            >
                                <TextArea rows={3} placeholder="Brief description of the page" />
                            </Form.Item>

                            <Divider>Content (JSON)</Divider>

                            <Form.Item
                                name="contentJson"
                                label="Content Blocks"
                                help="Enter content as JSON with blocks array"
                            >
                                <TextArea
                                    rows={15}
                                    placeholder='{"blocks": [{"type": "paragraph", "data": {"text": "Your content here"}}]}'
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </Form.Item>
                        </Card>
                    </Col>

                    {/* Sidebar */}
                    <Col xs={24} lg={8}>
                        <Card className="editor-sidebar" style={{ marginBottom: 16 }}>
                            <Title level={5}>Page Settings</Title>

                            <Form.Item
                                name="template"
                                label="Template"
                            >
                                <Select>
                                    {templates.map(t => (
                                        <Select.Option key={t} value={t}>{t}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="themeId"
                                label="Theme"
                            >
                                <Select allowClear placeholder="Use active theme">
                                    {themes.map(t => (
                                        <Select.Option key={t.id} value={t.id}>
                                            {t.name} {t.isActive && '(Active)'}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="isHomepage"
                                label="Set as Homepage"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>

                            <Form.Item
                                name="featuredImage"
                                label="Featured Image URL"
                            >
                                <Input placeholder="/uploads/image.jpg" />
                            </Form.Item>
                        </Card>

                        <Card className="editor-sidebar">
                            <Title level={5}>SEO</Title>

                            <Form.Item
                                name="seoTitle"
                                label="SEO Title"
                            >
                                <Input placeholder="Page title for search engines" />
                            </Form.Item>

                            <Form.Item
                                name="seoDesc"
                                label="Meta Description"
                            >
                                <TextArea rows={3} placeholder="Description for search engines" />
                            </Form.Item>

                            <Form.Item
                                name="seoKeywords"
                                label="Keywords"
                            >
                                <Input placeholder="keyword1, keyword2, keyword3" />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
