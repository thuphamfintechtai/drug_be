// Public API for Registration Bounded Context
export { RegistrationController } from "./presentation/controllers/RegistrationController.js";
export { createRegistrationRoutes } from "./presentation/routes/registrationRoutes.js";
export { RegistrationApplicationService } from "./application/services/RegistrationApplicationService.js";
export { RegistrationRequestRepository } from "./infrastructure/persistence/mongoose/RegistrationRequestRepository.js";

