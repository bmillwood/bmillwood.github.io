---
title: Backups can be easy!
---
## Summary

Using a newer filesystem like btrfs or zfs makes taking a full, read-only
snapshot of your entire filesystem a near-instant operation.

They're copy-on-write so you don't end up storing files twice if they don't
change. This means you can have lots of snapshots without much space overhead.

You can sync them with an external disk, and if the external disk already has
a previous snapshot, you only need to send the diffs, so the syncing can be
fast.

I use btrfs, and take a snapshot of my personal laptop's disk at startup.

About once a month, I sync all these snapshots to an external disk, which has
every snapshot I've made since 2018.

I also copy (using rsync) the first snapshot of every month to another external
disk that uses zfs instead, and then take a snapshot of that. So even if btrfs
mysteriously chewed up all my data, I still have monthly snapshots on zfs going
back years.

I then delete old snapshots from my laptop disk to free up space (it's smaller
than the external disks).

My root disk is pretty small and I don't store a lot of multimedia stuff that
would kick my storage needs up a lot. I don't know how well this strategy scales
if you do (although I'd guess... fine? Stuff just takes longer?)
  
If you're looking for a technical guide, then "btrfs and zfs both support
copy-on-write snapshots" is already 80% of the relevant technical detail of this
article. Most of the rest is conceptual stuff about how I think about backups.
If you need more technical detail and know how to contact me, feel free to ask.

## Types of failure

Perhaps the most obvious ways to lose data are:

* The disk storing the data stops working,
* You accidentally tell your computer to destroy it.

While looking for a solution for these, I realized there was another:

* The code for the filesystem you use has a bug, and wipes your disk by accident.

## Snapshot backups to prevent human error

My main motivation for backups was: suppose I delete a file that turned out to
be important, or edited a config that made something stop working, and I need
the old config back. How can I make all such mistakes reversible?

Snapshotting the whole disk makes sure that I can always go back to a state my
computer was in before. It's a complete state at a single moment in time, so I
don't need to worry about new things mixing with old things in incompatible
ways.

For a lot of mistakes, that's already enough, but I also wanted to protect
against "run this one bad command as root" or "change my disk configuration" or
"change my disk decryption key and forget the new key" and stuff like that.

That's why I send snapshots to an external disk: if the external disk is not
plugged in, and I make a mistake on my laptop, it seems extremely likely that
the external disk still works. If I make a mistake on my laptop *while the
external disk is plugged in*, then yeah, seems possible I could hose both. You
could just be careful while you're doing the sync, but in reality the sync takes
a while and I like to do other things at the same time, so I don't want to be
especially vigilant. This is part of why I have a second backup disk, and I
avoid having both plugged it at once.

Snapshotting does prompt the question of: when do you snapshot, and which
snapshots do you keep? Well, "when" just has to be regularly. Pick whatever
scheduling solution works for you. I take them at startup because it's easy to
arrange. I did for a moment wonder whether taking them at a weird time (e.g.
halfway through boot) could cause problems, but given that I expect my computer
to work even if it has a power failure halfway through the boot process, I
should expect a snapshot taken then to be viable too.

With regards which ones I keep, well, for me for now they're small enough that I
can feasibly keep them all on the external disk at least. Locally I used to do
some thinning-out thing, like all snapshots for a week, and then weekly ones for
a month, and then monthly for some longer time, or something like that. But
because of the way copy-on-write snapshots work, the most "expensive" snapshots
in disk space are always going to be the oldest ones, so I think overthinking
the spacing between is probably not worth it, and nowadays I just keep anything
that's not yet on an external disk (i.e. going no more than a month back).
Nearly all of the time when I've used a snapshot it's been one of the most
recent ones anyway.

## Protecting against filesystem software failure

When I decided to use btrfs to solve the above problem, people warned me "btrfs
is still under active development, a bit on the ambitious side, and has had
stability problems before. It's possible there could be a bug that would mean it
just refused to mount any of your disks one day."

Now, btrfs is more stable than it used to be, but it's hard to predict how bugs
might arise and what their impact could be. Even aside any specific concerns
about btrfs, some shockingly bad software bugs have showed up in pretty basic
functionality of pretty serious software over the last few years, so this does
seem like a real threat.

My approach to this is to just use two filesystems, and hope they don't both
have devastating implementation bugs at the same time, which is why my secondary
backup disk is on zfs. I use plain rsync to copy between them (though,
importantly, from a snapshot on the source, rather than from the live mounted
disk, which ensures the zfs drive has fully consistent snapshots as well). This
avoids any tricky special functionality that might be misimplemented, or
misunderstood by me.

I think for people with ordinary data that's an ordinary amount of valuable,
this risk might be too unlikely to bother with. But there are nice things about
having two backup disks anyway, and all it really costs to have them on
different filesystems is (a) my zfs snapshots are less frequent than my btrfs
ones, and (b) taking a zfs snapshot is slower than a btrfs one. These costs
don't feel burdensome for me.

## Protecting against hardware failure

The thing that makes hardware failures comparatively easy to deal with is that
they're generally random and uncorrelated, either with each other or with other
kinds of failure. This means that as long as (a) any single hardware failure
doesn't ruin you, and (b) you can quickly notice and respond to hardware
failures, it's pretty unlikely you'll lose data this way, because you'll be able
to restore redundancy before you're hit by it again.

\(a) is pretty easy to achieve, and in particular my scheme above with the
external disks already achieves it. (b) is a little trickier.

My crude mental model is that disks can fail in two ways: they can just totally
pack it in and die loudly, entirely failing to mount anymore, or they can
quietly flip some bits in a way that makes your data not what you thought it
was.

One of the drawbacks of copy-on-write snapshots in the style we've been
describing is a consequence of one of its strengths: if a file doesn't change
between snapshots, it's only stored once. This is an essential property, without
which there'd be no way we could store a month of snapshots on a disk not much
larger than a single snapshot. But the drawback is that if there was a disk
error that corrupted that file, it's corrupted on every snapshot at once.

Modern filesystems have checksums that can detect this condition, but... you
have to actually look at the checksums. btrfs has `btrfs scrub` for this, but I
don't run it in any systematic way. Probably I should fix that.

### Correlated hardware failures

I said before that hardware failures are uncorrelated, but it's worth mentioning
that there are some easy ways to make this accidentally not true. For example,
if you keep all your backup disks in a stack and then you pour hot chocolate on
the pile of disks, you have a correlated disk failure. If you keep all the disks
in your house and your house burns down or someone breaks in, you have a
correlated disk failure. In the setup I described, I try to keep the zfs disk in
a drawer in the office at work, and only bring it home when I'm doing the sync.
That level of risk seems acceptable to me. Using full-disk encryption helps
here, because it means that I don't need to worry too much about keeping the
location I store the disk secure.

## Verifying backups

One thing that I don't feel I currently have a good solution for, is confirming
that I could actually restore from my backups if necessary. I only have the one
laptop: I can look at my backups from there, but I'll only need them when I'm
looking at them from somewhere else.

As an example, I got bored of typing the decryption passphrase for my backups so
frequently, so for my convenience I set up a keyfile stored on my laptop (in
addition to the passphrase! I'm not *that* bad). But now I won't immediately
notice if I forget the passphrase, or if it isn't what I thought it was. So I
removed the keyfile, and went back to typing the passphrase every time.

## What am I still not protecting against?

A helpful process to go through is to imagine that you lost all your data, and
ask yourself why it happened. For me I think the leading explanations are:

* I forget the decryption details
* I lose all the disks at once
* The disks fail gradually in a way that I don't notice

The decryption key thing is a tradeoff: the more I protect against forgetting
the key myself, the more options I'm granting to someone who doesn't know it in
the first place. So that tension seems somewhat unavoidable.

The disk loss thing could be mitigated in a variety of ways. Using an internet
backup solution (presumably paid-for) is one, but I don't want to do that,
partly because, again, there are security tradeoffs (or at least, one has to do
work to persuade oneself that a given method is secure).

The gradual disk failure does seem like a place I could make some progress, e.g.
by manually kicking off a btrfs checksum thing when I'm doing the monthly
backup, and figuring out what to do on zfs as well.

This also folds into some more general concern that I have that just checking up
on my laptop's general health is hard, and there are a lot of problems that I
could already have without noticing. I'd be interested what the easy solutions
are there.
