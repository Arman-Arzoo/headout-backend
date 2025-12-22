// CreateReviewDto using class-validator decorators
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReviewDto {

    @IsString()
    experienceId: string;

    @IsNotEmpty()
    @IsNumber()
    rating: number;

    @IsString()
    comment: string;
}

