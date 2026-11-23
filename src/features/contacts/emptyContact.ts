import type { ContactInput } from '../../api/schemas';

export const emptyContact: ContactInput = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  companyId: '',
};
