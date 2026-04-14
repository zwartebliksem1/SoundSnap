import { useLocation, Link } from 'react-router-dom';
import { useAppSettings } from './appSettings';

export default function PageNotFound() {
    const location = useLocation();
    const { t } = useAppSettings();
    const pageName = location.pathname.substring(1);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <h1 className="text-7xl font-light text-muted-foreground">404</h1>
                <h2 className="text-2xl font-medium text-foreground">{t("pageNotFound")}</h2>
                <p className="text-muted-foreground">
                    {t("pageNotFoundDesc", { page: pageName })}
                </p>
                <Link to="/" className="inline-block mt-4 text-primary underline underline-offset-4">
                    {t("goBackHome")}
                </Link>
            </div>
        </div>
    );
}