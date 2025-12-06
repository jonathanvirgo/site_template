import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Card, Select, Switch, InputNumber, message, Space, Typography, Upload, Row, Col, Image } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { productApi, mediaApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function ProductEditor() {
    const { id } = useParams();
    const isNew = id === 'new';
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [specs, setSpecs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadCategories();
        if (!isNew) loadProduct();
    }, [id]);

    const loadCategories = async () => {
        try {
            const response = await productApi.getCategories();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadProduct = async () => {
        try {
            const response = await productApi.getOne(id);
            const product = response.data.data;
            form.setFieldsValue({
                ...product,
                categoryId: product.categoryId || undefined,
                price: parseFloat(product.price),
                salePrice: product.salePrice ? parseFloat(product.salePrice) : undefined
            });
            setImages(product.images || []);
            setSpecs(product.specs || []);
        } catch (error) {
            message.error('Failed to load product');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const data = {
                ...values,
                images,
                specs: specs.length > 0 ? specs : null
            };

            if (isNew) {
                await productApi.create(data);
                message.success('Product created');
            } else {
                await productApi.update(id, data);
                message.success('Product updated');
            }
            navigate('/products');
        } catch (error) {
            message.error('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const handleUpload = async (file) => {
        try {
            const response = await mediaApi.upload(file);
            const url = response.data.data.url;
            setImages([...images, url]);
            message.success('Image uploaded');
            return false;
        } catch (error) {
            message.error('Upload failed');
            return false;
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const addSpec = () => {
        setSpecs([...specs, { label: '', value: '' }]);
    };

    const updateSpec = (index, field, value) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = value;
        setSpecs(newSpecs);
    };

    const removeSpec = (index) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    if (loading) return <Card loading />;

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>Back to Products</Button>
            </div>

            <Title level={3}>{isNew ? 'New Product' : 'Edit Product'}</Title>

            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ status: 'DRAFT', stock: 0, price: 0 }}>
                <Row gutter={24}>
                    <Col span={16}>
                        <Card>
                            <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                                <Input size="large" placeholder="Product name" onChange={e => {
                                    if (isNew && !form.getFieldValue('slug')) {
                                        form.setFieldValue('slug', generateSlug(e.target.value));
                                    }
                                }} />
                            </Form.Item>
                            <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                                <Input addonBefore="/" />
                            </Form.Item>
                            <Form.Item name="shortDesc" label="Short Description">
                                <TextArea rows={2} placeholder="Brief product description..." />
                            </Form.Item>
                            <Form.Item name="description" label="Full Description">
                                <TextArea rows={8} placeholder="Detailed product description..." />
                            </Form.Item>
                        </Card>

                        <Card title="Images" style={{ marginTop: 24 }}>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                                {images.map((img, index) => (
                                    <div key={index} style={{ position: 'relative' }}>
                                        <Image src={img} width={100} height={100} style={{ objectFit: 'cover', borderRadius: 8 }} />
                                        <Button size="small" danger icon={<DeleteOutlined />}
                                            style={{ position: 'absolute', top: 4, right: 4 }}
                                            onClick={() => removeImage(index)} />
                                    </div>
                                ))}
                                <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
                                    <Button style={{ width: 100, height: 100 }} icon={<PlusOutlined />}>Upload</Button>
                                </Upload>
                            </div>
                        </Card>

                        <Card title="Specifications" style={{ marginTop: 24 }}>
                            {specs.map((spec, index) => (
                                <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                                    <Input placeholder="Label" value={spec.label} onChange={e => updateSpec(index, 'label', e.target.value)} style={{ width: 150 }} />
                                    <Input placeholder="Value" value={spec.value} onChange={e => updateSpec(index, 'value', e.target.value)} style={{ width: 200 }} />
                                    <Button icon={<DeleteOutlined />} danger onClick={() => removeSpec(index)} />
                                </Space>
                            ))}
                            <Button icon={<PlusOutlined />} onClick={addSpec}>Add Specification</Button>
                        </Card>

                        <Card title="SEO" style={{ marginTop: 24 }}>
                            <Form.Item name="seoTitle" label="SEO Title"><Input /></Form.Item>
                            <Form.Item name="seoDesc" label="SEO Description"><TextArea rows={2} /></Form.Item>
                        </Card>
                    </Col>

                    <Col span={8}>
                        <Card title="Publish">
                            <Form.Item name="status" label="Status">
                                <Select options={[
                                    { label: 'Draft', value: 'DRAFT' },
                                    { label: 'Active', value: 'ACTIVE' },
                                    { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
                                    { label: 'Discontinued', value: 'DISCONTINUED' }
                                ]} />
                            </Form.Item>
                            <Form.Item name="categoryId" label="Category">
                                <Select placeholder="Select category" allowClear options={categories.map(c => ({ label: c.name, value: c.id }))} />
                            </Form.Item>
                            <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} block style={{ marginTop: 16 }}>
                                {isNew ? 'Create' : 'Save'}
                            </Button>
                        </Card>

                        <Card title="Pricing" style={{ marginTop: 24 }}>
                            <Form.Item name="price" label="Price" rules={[{ required: true }]}>
                                <InputNumber prefix="$" style={{ width: '100%' }} min={0} precision={2} />
                            </Form.Item>
                            <Form.Item name="salePrice" label="Sale Price">
                                <InputNumber prefix="$" style={{ width: '100%' }} min={0} precision={2} />
                            </Form.Item>
                        </Card>

                        <Card title="Inventory" style={{ marginTop: 24 }}>
                            <Form.Item name="sku" label="SKU">
                                <Input placeholder="SKU-001" />
                            </Form.Item>
                            <Form.Item name="stock" label="Stock Quantity">
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
