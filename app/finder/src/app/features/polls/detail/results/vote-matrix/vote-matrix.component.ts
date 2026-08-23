import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OptionType, PollDetail } from '../../../_shared/models/poll-detail.model';
import { DateOptionFormatService } from '../../../_shared/utils/date-option-format.service';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';

interface MatrixPerson {
  name: string;
}

interface MatrixCell {
  mark: string;
  bg: string;
  fg: string;
}

interface MatrixRow {
  label: string;
  isEven: boolean;
  cells: MatrixCell[];
}

interface LegendItem {
  label: string;
  bg: string;
}

function cellFor(choice: string | undefined, type: OptionType): MatrixCell {
  if (choice == null || parseInt(choice) <= 0) {
    return { mark: '–', bg: '#f4f1ec', fg: '#c8c2b8' };
  }
  if (type === OptionType.Rating) {
    const v = parseInt(choice);
    const shades = ['#f9f2e2', '#f7ebd3', '#f4e2bd', '#efd6a2', '#e9c77f'];
    return { mark: String(v), bg: shades[v - 1] ?? shades[0], fg: '#8a6420' };
  }
  if (choice === '1') { return { mark: '✓', bg: '#dcecd9', fg: '#3f7a4e' }; }
  if (choice === '3') { return { mark: '~', bg: '#f6e7cf', fg: '#a8742a' }; }
  return { mark: '✕', bg: '#fae9e6', fg: '#c1453f' };
}

@Component({
  selector: 'app-vote-matrix',
  templateUrl: './vote-matrix.component.html',
  imports: [UserAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteMatrixComponent {
  private readonly dateFormat = inject(DateOptionFormatService);

  poll = input.required<PollDetail>();

  readonly people = computed((): MatrixPerson[] => {
    const seen = new Set<string>();
    const result: MatrixPerson[] = [];
    for (const opt of this.poll().options) {
      for (const v of opt.votes) {
        if (!seen.has(v.person)) {
          seen.add(v.person);
          result.push({ name: v.person });
        }
      }
    }
    return result;
  });

  readonly rows = computed((): MatrixRow[] => {
    const people = this.people();
    const type = this.poll().optionType;
    return this.poll().options.map((opt, idx) => {
      const voteMap = new Map(opt.votes.map(v => [v.person, v.choice]));
      const label = type === OptionType.Date
        ? this.dateFormat.formatLabel(opt.text)
        : opt.text;
      return {
        label,
        isEven: idx % 2 === 0,
        cells: people.map(p => cellFor(voteMap.get(p.name), type)),
      };
    });
  });

  readonly legend = computed((): LegendItem[] => {
    const type = this.poll().optionType;
    if (type === OptionType.Rating) {
      return [
        { label: '1 Stern', bg: '#f9f2e2' },
        { label: '3 Sterne', bg: '#f4e2bd' },
        { label: '5 Sterne', bg: '#e9c77f' },
      ];
    }
    return [
      { label: type === OptionType.Date ? 'Kann' : 'Ja', bg: '#dcecd9' },
      { label: 'Vielleicht', bg: '#f6e7cf' },
      { label: type === OptionType.Date ? 'Kann nicht' : 'Nein', bg: '#fae9e6' },
      { label: 'Offen', bg: '#f4f1ec' },
    ];
  });
}
