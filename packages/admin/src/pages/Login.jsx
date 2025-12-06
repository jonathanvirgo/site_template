import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const onFinish = async (values) => {
        setLoading(true);
        const result = await login(values.email, values.password);
        setLoading(false);

        if (result.success) {
            message.success('Login successful!');
            navigate('/');
        } else {
            message.error(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card fade-in">
                <div className="login-logo">
                    <h1>CMS Admin</h1>
                    <p>Sign in to your account</p>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Email"
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Password"
                            autoComplete="current-password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{ height: 48 }}
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>
                    <p>Default: admin@example.com / admin123</p>
                </div>
            </div>
        </div>
    );
}
