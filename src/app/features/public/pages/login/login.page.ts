import { Component, OnInit, } from "@angular/core";
declare var $: any;
import {
    Firestore,
    collection,
    addDoc,
    collectionData,
    query,
    where,
    doc,
    updateDoc
} from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "src/app/core/services/auth/auth.service";



@Component({
    selector: 'app-login-page',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})


export class LoginPage implements OnInit {
    loginForm!: FormGroup;



    constructor(
        private authService: AuthService,
        private fb: FormBuilder,

    ) {
    }






    ngOnInit(): void {
        this.buildForm();
    }

    buildForm() {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    async onSubmit() {
        if (this.loginForm.valid) {
            const { username, password } = this.loginForm.value;
            const loggedIn = await this.authService.login(username, password);

            if (!loggedIn) {
                // Aquí puedes mostrar un mensaje de error si quieres
                alert('Usuario o contraseña incorrectos.');
            }
        }
    }






}

