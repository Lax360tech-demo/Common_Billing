from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    identifier: str
    password: str

class UserRegister(BaseModel):
    owner_name: str
    store_name: str
    email: EmailStr
    phone: str
    password: str
    store_address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    gstin: Optional[str] = ""

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = ""
    role: str = "owner"
    store_id: str
    store_name: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    business: Optional[dict] = None
    category_config: Optional[dict] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class OAuthCallbackPayload(BaseModel):
    provider: str
    code: str
    redirect_uri: Optional[str] = ""

class OAuthCompleteSetupPayload(BaseModel):
    email: str
    name: str
    provider: str
    provider_id: str
    store_name: str
    phone: str
    store_address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    gstin: Optional[str] = ""
