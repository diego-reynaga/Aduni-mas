import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeAnimations } from './core/animations';
import { ConfirmationDialog } from './shared/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.isActivated ? outlet.activatedRoute?.snapshot?.url?.join('/') ?? '' : '';
  }
}
