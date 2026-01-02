import enum

class UserRole(enum.Enum):
    SENDER = 'SENDER'
    PICKER = 'PICKER'
    ADMIN = 'ADMIN'

class ItemStatus(enum.Enum):
    POSTED = 'POSTED'
    REQUESTED = 'REQUESTED'
    APPROVED = 'APPROVED'
    PICKED = 'PICKED'
    IN_TRANSIT = 'IN_TRANSIT'
    ARRIVED = 'ARRIVED'
    WAITING_CONFIRMATION = 'WAITING_CONFIRMATION'
    DELIVERED = 'DELIVERED'

class VerificationStatus(enum.Enum):
    UNVERIFIED = 'UNVERIFIED'
    PENDING = 'PENDING'
    VERIFIED = 'VERIFIED'

class TicketStatus(enum.Enum):
    OPEN = 'OPEN'
    PENDING = 'PENDING'
    RESOLVED = 'RESOLVED'
    CLOSED = 'CLOSED'

class TicketPriority(enum.Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    URGENT = 'URGENT'
