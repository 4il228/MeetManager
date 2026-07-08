export interface Meeting {
  id: string;
  title: string;
  creator_id: string;
  creator_name: string;
  start_time: string;
  end_time: string;
  participants: { id: string; full_name: string }[];
}
