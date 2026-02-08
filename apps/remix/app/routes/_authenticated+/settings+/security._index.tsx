import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { getSession } from '@documenso/auth/server/lib/utils/get-session';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { prisma } from '@documenso/prisma';

import { PasswordForm } from '~/components/forms/password';
import { SettingsHeader } from '~/components/general/settings-header';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/security._index';

export function meta() {
  return appMetaTags('Security');
}

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getSession(request);

  const hasEmailPasswordAccount: boolean = await prisma.user
    .count({
      where: {
        id: user.id,
        password: {
          not: null,
        },
      },
    })
    .then((value) => value > 0);

  return {
    hasEmailPasswordAccount,
  };
}

export default function SettingsSecurity({ loaderData }: Route.ComponentProps) {
  const { hasEmailPasswordAccount } = loaderData;

  const { _ } = useLingui();
  const { user } = useSession();

  return (
    <div>
      <SettingsHeader
        title={_(msg`Security`)}
        subtitle={_(msg`Here you can manage your password.`)}
      />
      {hasEmailPasswordAccount && <PasswordForm user={user} />}
    </div>
  );
}
