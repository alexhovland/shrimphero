-- ShrimpHero database, step 6 of 6: starting values.

-- Impact: shrimp helped per sticker = S x p / N = 1,000,000,000 x 0.10 / 1,000,000 = 100.
insert into public.settings (key, value, description) values
  ('S', 1000000000, 'Shrimp per year a Lidl win would cover. Schwarz Group sells about 2.2 billion a year (Rethink Priorities, Sept 2026); half assumed covered (own-brand warm-water), minus about 71 million already covered by Lidl GB.'),
  ('p', 0.10,       'Share of the win owed to store actions. A guess, same as the Aldi prototype.'),
  ('N', 1000000,    'Stickers needed to win. A guess, same as the Aldi prototype.')
on conflict (key) do nothing;

-- Reserved names: nobody may look official.
insert into public.nickname_blocklist (term, match) values
  ('lidl', 'contains'), ('kaufland', 'contains'), ('schwarz', 'contains'), ('icaw', 'contains'),
  ('shrimphero', 'contains'), ('admin', 'word'), ('administr', 'contains'), ('moderat', 'contains'), ('support', 'contains'),
  ('official', 'contains'), ('officiel', 'contains'), ('offiziell', 'contains'), ('ufficial', 'contains'),
  ('oficial', 'contains'), ('oficjal', 'contains'), ('staff', 'word'), ('mod', 'word'), ('root', 'word'),
  ('system', 'word')
on conflict (term) do nothing;

-- Insults and slurs. A starting list: native speakers should review and extend it.
-- 'contains' terms are long enough not to appear inside normal words; short ones are 'word' only.
insert into public.nickname_blocklist (term, match) values
  -- English
  ('fuck', 'contains'), ('shit', 'contains'), ('cunt', 'contains'), ('bitch', 'contains'), ('whore', 'contains'),
  ('slut', 'contains'), ('nigger', 'contains'), ('nigga', 'contains'), ('faggot', 'contains'), ('retard', 'contains'),
  ('rapist', 'contains'), ('hitler', 'contains'), ('paedo', 'contains'), ('pedophile', 'contains'), ('wanker', 'contains'),
  ('dickhead', 'contains'), ('asshole', 'contains'), ('bastard', 'contains'), ('tranny', 'contains'), ('whitepower', 'contains'),
  ('siegheil', 'contains'), ('kkk', 'contains'), ('motherfuck', 'contains'),
  ('ass', 'word'), ('dick', 'word'), ('cock', 'word'), ('fag', 'word'), ('kike', 'word'), ('spic', 'word'),
  ('chink', 'word'), ('nazi', 'word'), ('nazis', 'word'), ('pedo', 'word'), ('rape', 'word'), ('porn', 'word'),
  ('sex', 'word'), ('heil', 'word'), ('twat', 'word'), ('piss', 'word'),
  -- French
  ('putain', 'contains'), ('salope', 'contains'), ('connard', 'contains'), ('connasse', 'contains'), ('encule', 'contains'),
  ('batard', 'contains'), ('bougnoul', 'contains'), ('youpin', 'contains'), ('couille', 'contains'), ('negre', 'contains'),
  ('merde', 'contains'), ('pouffiasse', 'contains'), ('enfoire', 'contains'), ('ntm', 'word'),
  ('pute', 'word'), ('putes', 'word'), ('nique', 'word'), ('niquer', 'word'), ('pd', 'word'), ('tapette', 'word'),
  ('con', 'word'), ('conne', 'word'), ('bite', 'word'), ('chienne', 'word'), ('cul', 'word'), ('fdp', 'word'),
  -- German
  ('fotze', 'contains'), ('hurensohn', 'contains'), ('wichser', 'contains'), ('arschloch', 'contains'),
  ('schlampe', 'contains'), ('schwuchtel', 'contains'), ('neger', 'contains'), ('kanake', 'contains'),
  ('missgeburt', 'contains'), ('scheisse', 'contains'), ('judensau', 'contains'), ('untermensch', 'contains'),
  ('ficken', 'contains'), ('hure', 'word'), ('spast', 'word'), ('fick', 'word'), ('arsch', 'word'), ('schwanz', 'word'),
  ('nutte', 'word'), ('opfer', 'word'),
  -- Italian
  ('cazzo', 'contains'), ('stronzo', 'contains'), ('stronza', 'contains'), ('puttana', 'contains'),
  ('vaffanculo', 'contains'), ('frocio', 'contains'), ('minchia', 'contains'), ('coglione', 'contains'),
  ('merda', 'contains'), ('mignotta', 'contains'), ('troia', 'word'), ('culo', 'word'), ('figa', 'word'),
  ('negro', 'word'), ('negri', 'word'),
  -- Polish
  ('kurwa', 'contains'), ('jebac', 'contains'), ('pierdol', 'contains'), ('skurwysyn', 'contains'),
  ('pizda', 'contains'), ('dziwka', 'contains'), ('czarnuch', 'contains'), ('chuj', 'contains'),
  ('cipa', 'word'), ('pedal', 'word'), ('ciota', 'word'), ('kutas', 'word'),
  -- Spanish
  ('cabron', 'contains'), ('gilipollas', 'contains'), ('joder', 'contains'), ('mierda', 'contains'),
  ('maricon', 'contains'), ('pendejo', 'contains'), ('hijodeputa', 'contains'), ('sudaca', 'contains'),
  ('zorra', 'contains'), ('puta', 'word'), ('puto', 'word'), ('marica', 'word'), ('polla', 'word'),
  ('cono', 'word'), ('subnormal', 'word'), ('mongolo', 'word')
on conflict (term) do nothing;
