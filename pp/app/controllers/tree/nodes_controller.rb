# frozen_string_literal: true
class Tree::NodesController < ApplicationController

  def index
    respond_to do |format|
      format.html do
        skip_policy_scope
      end

      format.json do
        render json: Tree::StrategyResolver.call(params, &method(:policy_scope)).as_json
      end
    end
  end

end