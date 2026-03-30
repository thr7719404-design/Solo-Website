import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerListQueryDto,
  CustomerListResponseDto,
  CustomerItemDto,
} from './dto/customer-list.dto';
import { CreateCustomerDto, CreateCustomerResponseDto } from './dto/create-customer.dto';
import { CustomerDetailsDto } from './dto/customer-details.dto';
import { UpdateCustomerDto, UpdateCustomerResponseDto } from './dto/update-customer.dto';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto/address.dto';
import { LoyaltyService } from '../users/loyalty.service';
import * as argon2 from 'argon2';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  /**
   * Generate a random password of specified length
   */
  private generateRandomPassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Create a new customer
   */
  async create(dto: CreateCustomerDto): Promise<CreateCustomerResponseDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Parse fullName into firstName and lastName
    const nameParts = dto.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate password if not provided
    let generatedPassword: string | undefined;
    let password = dto.password;
    if (!password) {
      generatedPassword = this.generateRandomPassword(10);
      password = generatedPassword;
    }

    // Hash the password with Argon2id (consistent with auth service)
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        firstName,
        lastName,
        phone: dto.phone?.trim() || null,
        passwordHash,
        isActive: dto.isActive ?? true,
        role: 'CUSTOMER',
        emailVerified: true, // Admin-created accounts are pre-verified
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    const response: CreateCustomerResponseDto = {
      id: user.id,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    // Only include generated password in response for admin display
    if (generatedPassword) {
      response.generatedPassword = generatedPassword;
    }

    return response;
  }

  async findAll(query: CustomerListQueryDto): Promise<CustomerListResponseDto> {
    const { page: rawPage = 1, limit: rawLimit = 20, search, includeInactive = false } = query;
    
    // Ensure numeric values
    const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) : rawPage;
    const limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : rawLimit;
    const skip = (page - 1) * limit;

    // Build where clause - filter out admins, only show CUSTOMER role
    const where: any = {
      role: 'CUSTOMER',
    };

    // By default, only show active customers unless includeInactive is true
    if (!includeInactive) {
      where.isActive = true;
    }

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Get total count and users in parallel
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },
      }),
    ]);

    // Map to response format
    const items: CustomerItemDto[] = users.map((user) => ({
      id: user.id,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      ordersCount: user._count.orders,
      addressesCount: user._count.addresses,
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get customer details by ID
   */
  async findOne(id: string): Promise<CustomerDetailsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
        addresses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            label: true,
            firstName: true,
            lastName: true,
            city: true,
            addressLine1: true,
            addressLine2: true,
            phone: true,
            isDefault: true,
            createdAt: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    return {
      id: user.id,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      ordersCount: user._count.orders,
      addressesCount: user._count.addresses,
      addresses: user.addresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        fullName: [addr.firstName, addr.lastName].filter(Boolean).join(' ') || null,
        city: addr.city,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        phone: addr.phone,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
      })),
      orders: user.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
      })),
      loyalty: await this.getLoyaltySummary(user.id),
    };
  }

  /**
   * Get loyalty summary for a customer
   */
  private async getLoyaltySummary(userId: string) {
    const loyaltyData = await this.loyaltyService.getLoyalty(userId);
    return {
      balanceAed: Number(loyaltyData.balanceAed),
      totalEarnedAed: Number(loyaltyData.totalEarnedAed),
      totalRedeemedAed: Number(loyaltyData.totalRedeemedAed),
    };
  }

  /**
   * Update a customer by ID
   */
  async update(id: string, dto: UpdateCustomerDto): Promise<UpdateCustomerResponseDto> {
    // Check if customer exists and is a CUSTOMER role
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser || existingUser.role !== 'CUSTOMER') {
      throw new NotFoundException('Customer not found');
    }

    // If email is being changed, check for uniqueness
    if (dto.email && dto.email.toLowerCase().trim() !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });

      if (emailExists) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Build update data
    const updateData: any = {};

    if (dto.email !== undefined) {
      updateData.email = dto.email.toLowerCase().trim();
    }

    if (dto.fullName !== undefined) {
      const nameParts = dto.fullName.trim().split(/\s+/);
      updateData.firstName = nameParts[0] || '';
      updateData.lastName = nameParts.slice(1).join(' ') || '';
    }

    if (dto.phone !== undefined) {
      updateData.phone = dto.phone?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    // Update the user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      id: user.id,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * Soft delete a customer by setting isActive = false
   */
  async softDelete(id: string): Promise<{ success: boolean }> {
    // Check if customer exists and is a CUSTOMER role
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser || existingUser.role !== 'CUSTOMER') {
      throw new NotFoundException('Customer not found');
    }

    // Soft delete by setting isActive = false
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return { success: true };
  }

  // ============================================================================
  // ADDRESS CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new address for a customer
   */
  async createAddress(customerId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
    // Validate customer exists
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId, role: 'CUSTOMER' },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Parse fullName into firstName and lastName
    let firstName = '';
    let lastName = '';
    if (dto.fullName) {
      const nameParts = dto.fullName.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // If this is set as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Build addressLine2 from additional fields if not provided
    let addressLine2 = dto.addressLine2 || '';
    const additionalParts = [
      dto.area,
      dto.street,
      dto.building ? `Bldg ${dto.building}` : null,
      dto.apartment ? `Apt ${dto.apartment}` : null,
    ].filter(Boolean);
    if (additionalParts.length > 0 && !dto.addressLine2) {
      addressLine2 = additionalParts.join(', ');
    }

    const address = await this.prisma.address.create({
      data: {
        userId: customerId,
        label: dto.label || null,
        firstName,
        lastName,
        phone: dto.phone || null,
        city: dto.city,
        addressLine1: dto.addressLine1,
        addressLine2: addressLine2 || null,
        postalCode: null,
        isDefault: dto.isDefault ?? false,
      },
    });

    return this.mapAddressToResponse(address, dto);
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, dto: UpdateAddressDto): Promise<AddressResponseDto> {
    // Check if address exists
    const existingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults first
    if (dto.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { userId: existingAddress.userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    // Build update data
    const updateData: any = {};

    if (dto.label !== undefined) {
      updateData.label = dto.label || null;
    }

    if (dto.fullName !== undefined) {
      const nameParts = dto.fullName.trim().split(/\s+/);
      updateData.firstName = nameParts[0] || '';
      updateData.lastName = nameParts.slice(1).join(' ') || '';
    }

    if (dto.phone !== undefined) {
      updateData.phone = dto.phone || null;
    }

    if (dto.city !== undefined) {
      updateData.city = dto.city;
    }

    if (dto.addressLine1 !== undefined) {
      updateData.addressLine1 = dto.addressLine1;
    }

    if (dto.addressLine2 !== undefined) {
      updateData.addressLine2 = dto.addressLine2 || null;
    } else if (dto.area !== undefined || dto.street !== undefined || dto.building !== undefined || dto.apartment !== undefined) {
      // Build addressLine2 from additional fields
      const additionalParts = [
        dto.area,
        dto.street,
        dto.building ? `Bldg ${dto.building}` : null,
        dto.apartment ? `Apt ${dto.apartment}` : null,
      ].filter(Boolean);
      if (additionalParts.length > 0) {
        updateData.addressLine2 = additionalParts.join(', ');
      }
    }

    if (dto.isDefault !== undefined) {
      updateData.isDefault = dto.isDefault;
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    return this.mapAddressToResponse(address, dto);
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<{ success: boolean }> {
    // Check if address exists
    const existingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { success: true };
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(addressId: string): Promise<AddressResponseDto> {
    // Check if address exists
    const existingAddress = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existingAddress) {
      throw new NotFoundException('Address not found');
    }

    // Unset all other defaults for this customer
    await this.prisma.address.updateMany({
      where: { userId: existingAddress.userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });

    // Set this address as default
    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return this.mapAddressToResponse(address, {});
  }

  /**
   * Helper to map address entity to response DTO
   */
  private mapAddressToResponse(address: any, dto: any): AddressResponseDto {
    return {
      id: address.id,
      label: address.label,
      fullName: [address.firstName, address.lastName].filter(Boolean).join(' ') || null,
      phone: address.phone,
      city: address.city,
      area: dto.area || null,
      street: dto.street || null,
      building: dto.building || null,
      apartment: dto.apartment || null,
      notes: dto.notes || null,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
    };
  }
}
