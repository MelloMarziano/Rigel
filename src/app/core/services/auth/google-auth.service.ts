import { Injectable } from '@angular/core';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential, Auth } from 'firebase/auth';


@Injectable({
    providedIn: 'root',
})
export class GoogleAuthService {
    // constructor(private readonly afAuth: AngularFireAuth) { }

    private auth: Auth;

    constructor() {
        this.auth = getAuth(); // Inicializar Firebase Auth
    }

    async loginWithGoogleAuth() {
        console.log('Iniciando sesión con Google... servicio');
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        return signInWithPopup(auth, provider)
            .then((result) => {
                console.log('Usuario autenticado:', result.user);
                return result; // Devuelve todo el `result` para obtener `additionalUserInfo`.
            })
            .catch((error) => {
                console.error('Error al iniciar sesión:', error);
                throw error;
            });
    }

    async loginOrRegister(email: string, password: string): Promise<UserCredential> {
        if (!this.isValidEmail(email)) {
            throw new Error("Correo inválido");
        }

        try {
            // Intentar iniciar sesión
            const result = await signInWithEmailAndPassword(this.auth, email, password);
            console.log("Usuario autenticado:", result.user);
            return result;
        } catch (error: any) {
            if (error.code === "auth/user-not-found") {
                console.log("El usuario no existe, creando cuenta...");

                // Crear usuario si no existe
                try {
                    const newUser = await createUserWithEmailAndPassword(this.auth, email, password);
                    console.log("Usuario creado y autenticado:", newUser.user);
                    return newUser;
                } catch (registerError) {
                    console.error("Error al crear el usuario:", registerError);
                    throw registerError;
                }
            } else {
                console.error("Error en el login:", error);
                throw error;
            }
        }
    }

    
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }


    logout() {
        const auth = getAuth();
        return signOut(auth).then(() => console.log('Sesión cerrada'));
    }
}
