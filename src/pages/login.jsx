import Layout from '../components/layout';
import { getCookie } from 'cookies-next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function LoginPage({ email }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Show the "Logging in..." alert immediately
        Swal.fire({
            title: 'Logging in...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        setLoading(true);

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        // Simulate a delay of 2 seconds before handling the response
        setTimeout(async () => {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    let timerInterval;
                    Swal.fire({
                        icon: 'success',
                        title: 'Logged in!',
                        html: 'Please wait a moment.',
                        // html: "I will close in <b></b> milliseconds.",
                        timer: 2000,
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                            // const timer = Swal.getPopup().querySelector("b");
                            timerInterval = setInterval(() => {
                            // timer.textContent = `${Swal.getTimerLeft()}`;
                            }, 100);
                        },
                        willClose: () => {
                            clearInterval(timerInterval);
                        }
                    }).then(() => {
                        router.push('/');
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: result.message,
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'info',
                    title: 'Oops...',
                    text: 'Something went wrong. Please try again later.',
                });
            } finally {
                setLoading(false);
            }
        }, 2000); // Delay of 2 seconds
    };

    return (
        <Layout pageTitle="Login">
            <div className="flex flex-col items-center mt-16">
                <Link href="/">
                    <p className="link text-lg hover:underline mb-8">Home</p>
                </Link>
                
                <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
                    <h2 className="text-3xl font-semibold text-center mb-6">Log In</h2>
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input 
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                minLength="3" 
                                name="email" 
                                id="email" 
                                type="email" 
                                placeholder='Enter your email' 
                                required 
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input 
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                minLength="5" 
                                name="password" 
                                id="password" 
                                type="password" 
                                placeholder='Enter your password' 
                                required 
                            />
                        </div>
                        <div>
                            <button 
                                className="w-full py-3 btn-primary rounded-lg font-medium"
                                type="submit"
                                disabled={loading}>
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </div>
                        <div className="text-center text-gray-600 mt-4">
                            <p>Don't have an account? <Link href="/signup"><strong className="text-green-500 hover:underline">Sign Up</strong></Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export async function getServerSideProps(context) {
    const { req, res } = context;
    const email = getCookie('email', { req, res });

    if (email) {
        return {
            redirect: {
                permanent: false,
                destination: "/",
            },
        };
    }

    return { props: { email: false } };
}
