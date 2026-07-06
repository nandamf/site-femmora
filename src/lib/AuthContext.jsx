import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/api/authClient';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
	const [isLoadingAuth, setIsLoadingAuth] = useState(true);
	const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
	const [authError, setAuthError] = useState(null);
	const [user, setUser] = useState(null);

	useEffect(() => {
		let mounted = true;
		const init = async () => {
			try {
				const me = await authClient.auth.me();
				if (!mounted) return;
				setUser(me);
				setAuthError(null);
			} catch (err) {
				// Not authenticated is expected; keep user null
				if (!mounted) return;
				setUser(null);
				setAuthError(null);
			} finally {
				if (!mounted) return;
				setIsLoadingAuth(false);
			}
		};
		init();
		return () => {
			mounted = false;
		};
	}, []);

	const navigateToLogin = () => {
		if (typeof window !== 'undefined') window.location.href = '/login';
	};

	return (
		<AuthContext.Provider
			value={{ isLoadingAuth, isLoadingPublicSettings, authError, user, navigateToLogin }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}

export default AuthContext;
