import { useMemo } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router';

import { authClient } from '@documenso/auth/client';
import { useOptionalCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { EXTENDED_ORGANISATION_MEMBER_ROLE_MAP } from '@documenso/lib/constants/organisations-translations';
import { EXTENDED_TEAM_MEMBER_ROLE_MAP } from '@documenso/lib/constants/teams-translations';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { isAdmin } from '@documenso/lib/utils/is-admin';
import { canExecuteOrganisationAction } from '@documenso/lib/utils/organisations';
import { extractInitials } from '@documenso/lib/utils/recipient-formatter';
import { canExecuteTeamAction } from '@documenso/lib/utils/teams';
import { cn } from '@documenso/ui/lib/utils';
import { AvatarWithText } from '@documenso/ui/primitives/avatar';
import { Button } from '@documenso/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

import { useOptionalCurrentTeam } from '~/providers/team';

export const OrgMenuSwitcher = () => {
  const { _ } = useLingui();

  const { user } = useSession();

  const isUserAdmin = isAdmin(user);

  const currentOrganisation = useOptionalCurrentOrganisation();
  const currentTeam = useOptionalCurrentTeam();

  const formatAvatarFallback = (name?: string) => {
    if (name !== undefined) {
      return name.slice(0, 1).toUpperCase();
    }

    return user.name ? extractInitials(user.name) : user.email.slice(0, 1).toUpperCase();
  };

  const dropdownMenuAvatarText = useMemo(() => {
    if (currentTeam) {
      return {
        avatarSrc: formatAvatarUrl(currentTeam.avatarImageId),
        avatarFallback: formatAvatarFallback(currentTeam.name),
        primaryText: currentTeam.name,
        secondaryText: _(EXTENDED_TEAM_MEMBER_ROLE_MAP[currentTeam.currentTeamRole]),
      };
    }

    if (currentOrganisation) {
      return {
        avatarSrc: formatAvatarUrl(currentOrganisation.avatarImageId),
        avatarFallback: formatAvatarFallback(currentOrganisation.name),
        primaryText: currentOrganisation.name,
        secondaryText: _(
          EXTENDED_ORGANISATION_MEMBER_ROLE_MAP[currentOrganisation.currentOrganisationRole],
        ),
      };
    }

    return {
      avatarSrc: formatAvatarUrl(user.avatarImageId),
      avatarFallback: formatAvatarFallback(user.name ?? user.email),
      primaryText: user.name,
      secondaryText: _(msg`Personal Account`),
    };
  }, [currentTeam, currentOrganisation, user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="menu-switcher"
          variant="none"
          className="relative flex h-12 flex-row items-center px-0 py-2 ring-0 focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent md:px-2"
        >
          <AvatarWithText
            avatarSrc={dropdownMenuAvatarText.avatarSrc}
            avatarFallback={dropdownMenuAvatarText.avatarFallback}
            primaryText={dropdownMenuAvatarText.primaryText}
            secondaryText={dropdownMenuAvatarText.secondaryText}
            rightSideComponent={
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            }
            textSectionClassName="hidden lg:flex"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn('z-[60] ml-6 w-full min-w-[12rem] md:ml-0')}
        align="end"
        forceMount
      >
        {isUserAdmin && (
          <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
            <Link to="/admin">
              <Trans>Admin panel</Trans>
            </Link>
          </DropdownMenuItem>
        )}

        {currentOrganisation &&
          canExecuteOrganisationAction(
            'MANAGE_ORGANISATION',
            currentOrganisation.currentOrganisationRole,
          ) && (
            <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
              <Link to={`/o/${currentOrganisation.url}/settings`}>
                <Trans>Organisation settings</Trans>
              </Link>
            </DropdownMenuItem>
          )}

        {currentTeam && canExecuteTeamAction('MANAGE_TEAM', currentTeam.currentTeamRole) && (
          <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
            <Link to={`/t/${currentTeam.url}/settings`}>
              <Trans>Team settings</Trans>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
          <Link to="/inbox">
            <Trans>Personal Inbox</Trans>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="px-4 py-2 text-muted-foreground" asChild>
          <Link to="/settings/profile">
            <Trans>Account</Trans>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="px-4 py-2 text-destructive/90 hover:!text-destructive"
          onSelect={async () => authClient.signOut()}
        >
          <Trans>Sign Out</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
