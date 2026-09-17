import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ForgotPassword } from './Auth/ForgotPassword/ForgotPassword.component';
import { LoginComponent } from './Auth/Login/Login.component';
import { RegisterComponent } from './Auth/Register/Register.component';
import { ResetPassword } from './Auth/ResetPassword/ResetPassword.component';
import { Header } from './Common/Header/Header.component';
import { Footer } from './Common/Footer/Footer.component';
import { PageNotFound } from './Common/PageNotFound/PageNotFound.component'
import { Sidebar } from './Common/Sidebar/Sidebar.component';
import { AddProduct } from './Products/AddProduct/AddProduct.component';
import { EditProduct } from './Products/EditProduct/EditProduct.component';
import { ProductDetailsLanding } from './Products/ProductDetailsLanding/ProductDetailsLanding.component';
import { SearchProduct } from './Products/SearchProduct/SearchProduct.component';
import { ViewProducts } from './Products/ViewProducts/ViewProducts.component';
import { Chat } from './Users/Chat/Chat.component';
import { Dashboard } from './Users/Dashboard/Dashboard.component';
import { Notifications } from './Users/Notifications/Notifications.component';
import { Admin } from './Admin/Admin.component';
import { About } from './About/About.component';
import { Contact } from './Contact/Contact.component';
import { Settings } from './Settings/Settings.component';
import { ROLES } from '../constants/roles';

const AuthenticatedLayout = ({ children }) => (
    <div className="app-shell">
        <Header isLoggedIn={true}></Header>
        <div className="main">
            <Sidebar></Sidebar>
            <div className="content">
                {children}
            </div>
        </div>
        <Footer></Footer>
    </div>
)

const ProtectedRoute = ({ children }) => {
    if (!localStorage.getItem('token')) {
        return <Navigate to="/" replace></Navigate>
    }
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

const AdminRoute = ({ children }) => {
    if (!localStorage.getItem('token')) {
        return <Navigate to="/" replace></Navigate>
    }
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser?.role !== ROLES.ADMIN) {
        return <Navigate to="/dashboard" replace></Navigate>
    }
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

const PublicRoute = ({ children }) => (
    <div className="app-shell">
        <Header></Header>
        <div className="main">
            <div className="content">
                {children}
            </div>
        </div>
        <Footer></Footer>
    </div>
)

export const AppRouting = () => {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<PublicRoute><LoginComponent /></PublicRoute>}></Route>
                <Route path="/register" element={<PublicRoute><RegisterComponent /></PublicRoute>}></Route>
                <Route path="/forgot_password" element={<PublicRoute><ForgotPassword /></PublicRoute>}></Route>
                <Route path="/reset_password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>}></Route>
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>}></Route>
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}></Route>
                <Route path="/add_product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>}></Route>
                <Route path="/view_products" element={<ProtectedRoute><ViewProducts /></ProtectedRoute>}></Route>
                <Route path="/search_product" element={<ProtectedRoute><SearchProduct /></ProtectedRoute>}></Route>
                <Route path="/edit_product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>}></Route>
                <Route path="/product_details/:id" element={<ProtectedRoute><ProductDetailsLanding /></ProtectedRoute>}></Route>
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>}></Route>
                <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>}></Route>
                <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>}></Route>
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>}></Route>
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>}></Route>
                <Route path="*" element={<PublicRoute><PageNotFound /></PublicRoute>}></Route>
            </Routes>
        </BrowserRouter>
    )
}
