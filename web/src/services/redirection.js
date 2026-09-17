import { ROLES } from '../constants/roles';

export const redirectToDashboard = (role, navigate) => {
    let redirectPath = '/';
    switch (role) {
        case ROLES.ADMIN:
            redirectPath = '/admin'
            break;
        case ROLES.USER:
            redirectPath = '/dashboard'
            break;
        default:
            break;
    }
    navigate(redirectPath)
}
