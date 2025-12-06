import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { postApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function PostCategories() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await postApi.getCategories();
            setCategories(response.data.data || []);
        } catch (error) {
            message.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingCategory) {
                await postApi.updateCategory(editingCategory.id, values);
                message.success('Category updated');
            } else {
                await postApi.createCategory(values);
                message.success('Category created');
            }
            setModalOpen(false);
            form.resetFields();
            setEditingCategory(null);
            loadCategories();
        } catch (error) {
            message.error('Failed to save category');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        form.setFieldsValue(category);
        setModalOpen(true);
    };

    const handleDelete = (category) => {
        Modal.confirm({
            title: 'Delete Category?',
            content: `This will delete "${category.name}" and may affect posts.`,
            okType: 'danger',
            onOk: async () => {
                try {
                    await postApi.deleteCategory(category.id);
                    message.success('Category deleted');
                    loadCategories();
                } catch (error) {
                    message.error('Failed to delete category');
                }
            }
        });
    };

    const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Slug', dataIndex: 'slug', key: 'slug' },
        { title: 'Posts', dataIndex: ['_count', 'posts'], key: 'posts', render: v => v || 0 },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)} />
                </Space>
            )
        }
    ];

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/posts')}>Back to Posts</Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Post Categories</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCategory(null); form.resetFields(); setModalOpen(true); }}>
                    New Category
                </Button>
            </div>

            <Table columns={columns} dataSource={categories} rowKey="id" loading={loading} />

            <Modal
                title={editingCategory ? 'Edit Category' : 'New Category'}
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); setEditingCategory(null); }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input onChange={e => { if (!editingCategory) form.setFieldValue('slug', generateSlug(e.target.value)); }} />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="image" label="Image URL">
                        <Input />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        {editingCategory ? 'Update' : 'Create'}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
