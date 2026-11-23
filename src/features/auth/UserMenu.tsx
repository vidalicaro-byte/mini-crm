import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { roleLabels } from './roles';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!user) return null;

  // The menu hides the page (aria-hidden) while it is open and while it animates out, so focus
  // must not sit on the trigger when it opens, and returns to it only once the menu is gone.
  function close() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setAnchor(null);
  }

  return (
    <>
      <IconButton
        ref={triggerRef}
        color="inherit"
        aria-label={`Conta de ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => {
          event.currentTarget.blur();
          setAnchor(event.currentTarget);
        }}
      >
        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
          {initials(user.name)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        slotProps={{
          root: { disableRestoreFocus: true },
          transition: { onExited: () => triggerRef.current?.focus() },
        }}
      >
        <Typography sx={{ px: 2, pt: 1, fontWeight: 700 }}>{user.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
          {user.email}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          {roleLabels[user.role]}
        </Typography>
        <Divider />
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </>
  );
}
