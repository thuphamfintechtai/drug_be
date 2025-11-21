import { RegisterUserDTO } from "../dto/RegisterUserDTO.js";
import { UserResponseDTO } from "../dto/UserResponseDTO.js";
import { User } from "../../domain/aggregates/User.js";
import { Role } from "../../domain/value-objects/Role.js";
import crypto from "crypto";

export class RegisterUserUseCase {
  constructor(
    userRepository,
    passwordHasher,
    eventBus
  ) {
    this._userRepository = userRepository;
    this._passwordHasher = passwordHasher;
    this._eventBus = eventBus;
  }

  async execute(registerDTO, role = Role.user().value) {
    registerDTO.validate();

    // Check if user already exists
    const existingUser = await this._userRepository.findByEmailOrUsername(
      registerDTO.email,
      registerDTO.username
    );

    if (existingUser) {
      throw new Error("Email hoặc username đã tồn tại");
    }

    // Hash password
    const passwordHash = await this._passwordHasher.hash(registerDTO.password);

    // Create user aggregate
    const userId = crypto.randomUUID();
    const user = User.create(
      userId,
      registerDTO.username,
      registerDTO.email,
      passwordHash,
      role,
      registerDTO.fullName,
      registerDTO.phone,
      registerDTO.country,
      registerDTO.address
    );

    // Save user
    await this._userRepository.save(user);

    // Publish domain events
    user.domainEvents.forEach((event) => {
      this._eventBus.publish(event);
    });

    return UserResponseDTO.fromUser(user);
  }
}

