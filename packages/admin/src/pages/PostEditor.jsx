import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Card, Select, Switch, message, Space, Typography, Upload, Row, Col } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { postApi, mediaApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function PostEditor() {
    const { id } = useParams();
    const isNew = !id || id === 'new';
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadCategories();
        if (!isNew) loadPost();
    }, [id]);

    const loadCategories = async () => {
        try {
            const response = await postApi.getCategories();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadPost = async () => {
        try {
            const response = await postApi.getOne(id);
            const post = response.data.data;
            form.setFieldsValue({
                ...post,
                categoryId: post.categoryId || undefined,
                content: JSON.stringify(post.content, null, 2)
            });
        } catch (error) {
            message.error('Failed to load post');
            navigate('/posts');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            let content = null;
            if (values.content) {
                try {
                    content = JSON.parse(values.content);
                } catch {
                    content = { blocks: [{ type: 'paragraph', data: { text: values.content } }] };
                }
            }

            const data = {
                ...values,
                content,
                status: values.status || 'DRAFT'
            };

            if (isNew) {
                await postApi.create(data);
                message.success('Post created');
            } else {
                await postApi.update(id, data);
                message.success('Post updated');
            }
            navigate('/posts');
        } catch (error) {
            message.error('Failed to save post');
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleUpload = async (file) => {
        try {
            const response = await mediaApi.upload(file);
            const url = response.data.data.url;
            form.setFieldValue('featuredImage', url);
            message.success('Image uploaded');
            return false;
        } catch (error) {
            message.error('Upload failed');
            return false;
        }
    };

    if (loading) return <Card loading />;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/posts')}>
                    Back to Posts
                </Button>
            </div>

            <Title level={3}>{isNew ? 'New Post' : 'Edit Post'}</Title>

            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ status: 'DRAFT' }}>
                <Row gutter={24}>
                    <Col span={16}>
                        <Card>
                            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                                <Input
                                    size="large"
                                    placeholder="Post title"
                                    onChange={e => {
                                        if (isNew && !form.getFieldValue('slug')) {
                                            form.setFieldValue('slug', generateSlug(e.target.value));
                                        }
                                    }}
                                />
                            </Form.Item>

                            <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                                <Input addonBefore="/" />
                            </Form.Item>

                            <Form.Item name="excerpt" label="Excerpt">
                                <TextArea rows={3} placeholder="Brief summary..." />
                            </Form.Item>

                            <Form.Item name="content" label="Content (JSON)">
                                <TextArea rows={15} placeholder='{"blocks": []}' />
                            </Form.Item>
                        </Card>

                        <Card title="SEO" style={{ marginTop: 24 }}>
                            <Form.Item name="seoTitle" label="SEO Title">
                                <Input />
                            </Form.Item>
                            <Form.Item name="seoDesc" label="SEO Description">
                                <TextArea rows={2} />
                            </Form.Item>
                        </Card>
                    </Col>

                    <Col span={8}>
                        <Card title="Publish">
                            <Form.Item name="status" label="Status">
                                <Select options={[
                                    { label: 'Draft', value: 'DRAFT' },
                                    { label: 'Published', value: 'PUBLISHED' }
                                ]} />
                            </Form.Item>

                            <Form.Item name="categoryId" label="Category">
                                <Select
                                    placeholder="Select category"
                                    allowClear
                                    options={categories.map(c => ({ label: c.name, value: c.id }))}
                                />
                            </Form.Item>

                            <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Form.Item name="tags" label="Tags">
                                <Input placeholder="tag1, tag2, tag3" />
                            </Form.Item>

                            <Space style={{ width: '100%', marginTop: 16 }}>
                                <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} block>
                                    {isNew ? 'Create' : 'Save'}
                                </Button>
                            </Space>
                        </Card>

                        <Card title="Featured Image" style={{ marginTop: 24 }}>
                            <Form.Item name="featuredImage">
                                <Input placeholder="/uploads/image.jpg" />
                            </Form.Item>
                            <Upload
                                beforeUpload={handleUpload}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />}>Upload Image</Button>
                            </Upload>
                            {form.getFieldValue('featuredImage') && (
                                <img
                                    src={form.getFieldValue('featuredImage')}
                                    alt="Preview"
                                    style={{ width: '100%', marginTop: 12, borderRadius: 8 }}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
