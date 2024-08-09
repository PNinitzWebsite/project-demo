import Layout from '../components/layout'
import { getCookie } from 'cookies-next';
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SignupPage({ email }) {
    const router = useRouter();
    const { msg } = router.query;

    return (
        <Layout pageTitle="Sign Up">
            <div className="flex flex-col items-center mt-16">
                <Link href="/">
                    <p className="link text-lg hover:underline mb-8">Home</p>
                </Link>
                {msg && (
                    <div className="bg-red-100 text-red-600 p-4 rounded mb-6">
                        <h3>{msg}</h3>
                    </div>
                )}
                <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
                    <h2 className="text-3xl font-semibold text-center mb-6">Create an Account</h2>
                    <form action='/api/signup' method='POST' className='space-y-6'>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input 
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
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
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                                minLength="5" 
                                name="password" 
                                id="password" 
                                type="password" 
                                placeholder='Create a password' 
                                required 
                            />
                        </div>
                        <div>
                            <label htmlFor="passwordagain" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <input 
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                                minLength="5" 
                                name="passwordagain" 
                                id="passwordagain" 
                                type="password" 
                                placeholder='Confirm your password' 
                                required 
                            />
                        </div>
                        <div>
                            <button 
                                className="w-full py-3 btn-secondary text-white rounded-lg font-medium transition duration-300"
                                type="submit">
                                Sign Up
                            </button>
                        </div>
                        <div className="text-center text-gray-600 mt-4">
                            <p>Already have an account? <Link href="/login"><strong className="text-blue-500 hover:underline">Login</strong></Link></p>
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
