export type Status = 'Imaging' | 'Shipped' | 'Completed';

export type Branch = 'HQ' | 'Sales' | 'Engineering' | 'HR' | 'Warehouse';

export interface PC {
  id: string;
  serial: string;
  branch: Branch;
  status: Status;
  // Optional for animation
  x?: number;
  y?: number;
}
