// Types
export interface UserType {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  tier: number;
  is_email_verified: boolean;
  is_phone_number_verified: boolean;
  is_liveness_check_verified: boolean;
  is_bvn_verified: boolean;
  paystack_customer_verified: boolean;
  paystack_dva_status: number;
  paystack_dva_account_name: string;
  paystack_dva_account_number: string;
  paystack_dva_currency: string;
  paystack_dva_bank_code: string;
  paystack_dva_bank_name: string;
  paystack_dva_bank_slug: string;
  avatar?: string;
  is_staff: boolean;
}

export interface LoginCredentialsType {
  email: string;
  password: string;
}

export interface RegisterDataType {
  username: string;
  email: string;
  password: string;
  phone_number: string;
  firstName?: string;
  lastName?: string;
}
