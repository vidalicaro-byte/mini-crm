import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { ColorModeToggle } from '../theme/ColorModeToggle';
import { navItems } from './navigation';

const DRAWER_WIDTH = 240;

export function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusToMenuButton = useRef(false);
  const isFirstRender = useRef(true);

  function closeDrawer(restoreFocus: boolean) {
    restoreFocusToMenuButton.current = restoreFocus;
    setMobileOpen(false);
  }

  // Closing the drawer with Escape or the backdrop returns focus to the menu button.
  // Done here, after the drawer has released the page, because MUI's own restore runs
  // while the page is still aria-hidden. Navigating moves focus to the content instead.
  useEffect(() => {
    if (!mobileOpen && restoreFocusToMenuButton.current) {
      restoreFocusToMenuButton.current = false;
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  // After a client-side navigation, move focus to the content so keyboard and
  // screen reader users start at the new page instead of the old position.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  const navigation = (
    <nav aria-label="Principal">
      <Toolbar />
      <List sx={{ px: 1 }}>
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={end}
            onClick={() => closeDrawer(false)}
            sx={{ borderRadius: 1, '&.active': { bgcolor: 'action.selected' } }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </nav>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="a"
        href="#conteudo"
        sx={{
          position: 'absolute',
          left: 8,
          top: -48,
          zIndex: theme.zIndex.tooltip,
          bgcolor: 'background.paper',
          px: 2,
          py: 1,
          borderRadius: 1,
          '&:focus': { top: 8 },
        }}
      >
        Pular para o conteúdo
      </Box>

      <AppBar
        position="fixed"
        sx={{ zIndex: theme.zIndex.drawer + 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              ref={menuButtonRef}
              color="inherit"
              edge="start"
              aria-label="Abrir menu de navegação"
              onClick={(event) => {
                // The drawer hides the page with aria-hidden when it opens; the button must
                // not hold focus at that moment (it would be hidden while focused).
                event.currentTarget.blur();
                setMobileOpen(true);
              }}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="p" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Mini-CRM
          </Typography>
          <ColorModeToggle />
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {navigation}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => closeDrawer(true)}
          slotProps={{ root: { disableRestoreFocus: true } }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {navigation}
        </Drawer>
      )}

      <Box
        component="main"
        id="conteudo"
        ref={mainRef}
        tabIndex={-1}
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 }, outline: 'none' }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
