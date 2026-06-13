import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="text-7xl font-bold text-surface-2 mb-4">404</div>
        <h1 className="text-xl font-semibold text-text mb-2">Page introuvable</h1>
        <p className="text-text-3 text-sm mb-6">Cette page n'existe pas ou a été déplacée.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-text text-white text-sm font-semibold rounded-lg hover:bg-dark transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
