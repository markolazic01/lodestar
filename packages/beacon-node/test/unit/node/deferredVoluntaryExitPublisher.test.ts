import {EventEmitter} from "node:events";
import {describe, expect, it, vi} from "vitest";
import {Logger} from "@lodestar/utils";
import {IBeaconChain} from "../../../src/chain/index.js";
import {INetwork} from "../../../src/network/index.js";
import {startDeferredVoluntaryExitPublisher} from "../../../src/node/deferredVoluntaryExitPublisher.js";
import {ClockEvent} from "../../../src/util/clock.js";

describe("startDeferredVoluntaryExitPublisher", () => {
  it("drains against the cached head state without regenerating to wall-clock epoch", async () => {
    const clock = new EventEmitter();
    const state = {} as ReturnType<IBeaconChain["getHeadState"]>;
    const getHeadState = vi.fn(() => state);
    const getHeadStateAtCurrentEpoch = vi.fn(async () => state);
    const drainProcessableExits = vi.fn(() => []);
    const chain = {
      clock,
      getHeadState,
      getHeadStateAtCurrentEpoch,
      deferredVoluntaryExitPool: {drainProcessableExits},
    } as unknown as IBeaconChain;
    const controller = new AbortController();

    startDeferredVoluntaryExitPublisher({
      chain,
      network: {} as INetwork,
      logger: {} as Logger,
      signal: controller.signal,
    });
    clock.emit(ClockEvent.epoch);

    await vi.waitFor(() => expect(drainProcessableExits).toHaveBeenCalledWith(state));
    expect(getHeadState).toHaveBeenCalledOnce();
    expect(getHeadStateAtCurrentEpoch).not.toHaveBeenCalled();
    controller.abort();
  });
});
