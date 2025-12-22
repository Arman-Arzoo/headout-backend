import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { CreateVendorProfileDto } from './dto/vendor-profile.dto';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  // create
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async createVendorProfile(@Req() req, @Body() dto: CreateVendorProfileDto) {
    const userId = req.user.id;
    return this.vendorService.create(userId, dto);
  }

  // get all
  @Get('profiles')
  async getAllVendorProfiles() {
    return this.vendorService.findAll();
  }
  

  // get by id
  @UseGuards(JwtAuthGuard)
  @Get('profile/:id')
  async getVendorProfileById(@Param('id') id: string) {
    return this.vendorService.findById(id);
  }

  // update
  @UseGuards(JwtAuthGuard)
  @Put('profile/update/:id')
  async updateVendorProfile(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVendorProfileDto>,
  ) {
    return this.vendorService.update(id, dto);
  }

  // delete
  @UseGuards(JwtAuthGuard)
  @Delete('profile/delete/:id')
  async deleteVendorProfile(@Param('id') id: string) {
    return this.vendorService.delete(id);
  }
}
