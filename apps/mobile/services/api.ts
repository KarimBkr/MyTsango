// Client API simple pour appeler les endpoints du backend
const API_BASE_URL = "http://localhost:3000";  // TODO: éventuellement utiliser une variable d'env (voir .env.mobile)

export const apiClient = {
    get: async (path: string) => {
        const res = await fetch(`${API_BASE_URL}${path}`);
        return res.json();
    },
    // On pourrait ajouter POST, PUT, DELETE selon les besoins
};
