import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-usuarios-page',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage implements OnInit {
  constructor(private firestore: Firestore) {}

  ngOnInit(): void {}
}
