import { ApiProperty } from '@nestjs/swagger';
import { CharacterDto } from '../../character/dto/character.dto';
import { QuestDto } from './quest.dto';

export class CompleteQuestResponseDto {
  @ApiProperty({ type: QuestDto })
  quest!: QuestDto;

  @ApiProperty({ type: CharacterDto })
  character!: CharacterDto;

  /// Whether this call granted the Daily reward loop's First Brave Step
  /// bonus (rewards-retention.md) — always false for split(), which doesn't
  /// grant either daily bonus (see QuestService.complete's docblock).
  @ApiProperty()
  firstBraveStepBonusGranted!: boolean;

  /// Whether this call granted the Today's Three bonus for this specific
  /// quest — always false for split().
  @ApiProperty()
  todaysThreeBonusGranted!: boolean;
}
